/**
 * Scans photo folders, copies images to public/images/photos/,
 * and generates src/photoManifest.json for the Remotion component.
 *
 * Usage: node loadimage.js
 */

const fs = require("fs");
const path = require("path");

const CONFIG = {
  music: "./resource/music/",
  duration: 218,
  categories: [
    {
      name: "graduation",
      title: "学生时代·毕业季",
      folderPath: "./resource/image/学生毕业照",
      emphasis: false,
    },
    {
      name: "xinjiang",
      title: "陪你去远方·新疆",
      folderPath: "./resource/image/新疆",
      emphasis: false,
    },
    {
      name: "guilin",
      title: "山水之间·桂林",
      folderPath: "./resource/image/桂林",
      emphasis: false,
    },
    {
      name: "xishuangbanna",
      title: "雨林秘境·西双版纳",
      folderPath: "./resource/image/西双版纳",
      emphasis: false,
    },
    {
      name: "certificate",
      title: "我们领证啦",
      folderPath: "./resource/image/领证",
      emphasis: true,
    },
    {
      name: "wedding_photo",
      title: "我们的婚纱照",
      folderPath: "./resource/image/婚纱照",
      emphasis: true,
    },
  ],
  style: "warm-cinematic",
  ending: {
    names: "王礼安 & 谭盈",
    date: "2026.05.30",
    thanks: "感谢见证我们的爱情",
    summary: [
      "从校园到远方，从山水到雨林",
      "一路走来，每一个瞬间都是最美的风景",
      "王礼安 & 谭盈，今天，我们结婚啦",
    ],
  },
};

const PUBLIC_DIR = path.resolve(__dirname, "public", "images", "photos");
const MANIFEST_PATH = path.resolve(__dirname, "src", "photoManifest.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read JPEG dimensions from file header
function getJpegDimensions(filePath) {
  const fd = fs.openSync(filePath, "r");
  // Read up to 64KB to find the SOF marker (EXIF data can be large)
  const bufSize = 65536;
  const buf = Buffer.alloc(bufSize);
  const bytesRead = fs.readSync(fd, buf, 0, bufSize, 0);
  fs.closeSync(fd);

  let offset = 2;
  while (offset < bytesRead - 9) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    // Skip over markers that have length fields (not RST or standalone markers)
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segLen = buf.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }
  return null;
}

// Read PNG dimensions from file header
function getPngDimensions(filePath) {
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(32);
  fs.readSync(fd, buf, 0, 32, 0);
  fs.closeSync(fd);

  if (buf.toString("ascii", 1, 4) !== "PNG") return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

// Read image dimensions without external dependencies
function getImageDimensions(filePath) {
  const fd = fs.openSync(filePath, "r");
  const header = Buffer.alloc(4);
  fs.readSync(fd, header, 0, 4, 0);
  fs.closeSync(fd);

  if (header[0] === 0xff && header[1] === 0xd8) {
    return getJpegDimensions(filePath) || { width: 1920, height: 1080 };
  }
  if (header[0] === 0x89 && header[1] === 0x50) {
    return getPngDimensions(filePath) || { width: 1920, height: 1080 };
  }
  return { width: 1920, height: 1080 };
}

function findMusicFiles(musicPath) {
  const absPath = path.resolve(__dirname, musicPath);
  if (!fs.existsSync(absPath)) return [];
  return fs
    .readdirSync(absPath)
    .filter((f) => /\.(mp3|wav|ogg|aac|m4a)$/i.test(f))
    .map((f) => path.join(musicPath, f));
}

function scanCategory(cat) {
  const absPath = path.resolve(__dirname, cat.folderPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`Warning: folder not found: ${cat.folderPath}`);
    return [];
  }
  const files = fs
    .readdirSync(absPath)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }));
  return files.map((f) => ({
    original: path.join(cat.folderPath, f),
    dest: path.join("public", "images", "photos", cat.name, f),
  }));
}

function main() {
  console.log("Scanning photo folders...");

  ensureDir(PUBLIC_DIR);

  const categories = [];
  let totalPhotos = 0;

  for (const cat of CONFIG.categories) {
    const catDir = path.join(PUBLIC_DIR, cat.name);
    ensureDir(catDir);

    const files = fs
      .readdirSync(path.resolve(__dirname, cat.folderPath))
      .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }));

    const photos = files.map((f, i) => {
      const ext = path.extname(f);
      const destName = `${String(i + 1).padStart(3, "0")}${ext}`;
      const src = path.resolve(__dirname, cat.folderPath, f);
      const dest = path.join(catDir, destName);
      fs.copyFileSync(src, dest);
      const dims = getImageDimensions(dest);
      return {
        path: `images/photos/${cat.name}/${destName}`,
        width: dims.width,
        height: dims.height,
      };
    });

    categories.push({
      name: cat.name,
      title: cat.title,
      photos,
      emphasis: cat.emphasis,
    });

    totalPhotos += photos.length;
    console.log(`  ${cat.title}: ${photos.length} photos`);
  }

  // Copy music to public/
  let music = null;
  const musicFiles = findMusicFiles(CONFIG.music);
  if (musicFiles.length > 0) {
    const musicSrc = path.resolve(__dirname, musicFiles[0]);
    const musicName = path.basename(musicFiles[0]);
    const musicDestDir = path.resolve(__dirname, "public", "music");
    ensureDir(musicDestDir);
    const musicDest = path.join(musicDestDir, musicName);
    fs.copyFileSync(musicSrc, musicDest);
    music = `music/${musicName}`;
    console.log(`  Music: ${music}`);
  }

  const manifest = {
    music,
    duration: CONFIG.duration,
    fps: 30,
    categories,
    style: CONFIG.style,
    ending: CONFIG.ending,
    totalPhotos,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${MANIFEST_PATH}`);
  console.log(`Total photos: ${totalPhotos}`);
  if (music) {
    console.log(`Music: ${music}`);
  } else {
    console.log("No music file found.");
  }
}

main();
