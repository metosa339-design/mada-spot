import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load env vars from .env
config();

// Config — uses env vars, never hardcode credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET in .env');
  process.exit(1);
}

const PUBLIC_DIR = path.resolve('public/images');
const MAPPING_FILE = path.resolve('scripts/cloudinary-mapping.json');

// Load existing mapping if any
let mapping = {};
if (fs.existsSync(MAPPING_FILE)) {
  mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
  console.log(`Loaded ${Object.keys(mapping).length} existing mappings`);
}

function getAllImages(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllImages(fullPath));
    } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)) {
      const relativePath = '/' + path.relative(path.resolve('public'), fullPath).replace(/\\/g, '/');
      const stats = fs.statSync(fullPath);
      files.push({ fullPath, relativePath, size: stats.size });
    }
  }
  return files;
}

async function uploadOne({ fullPath, relativePath, size }) {
  if (mapping[relativePath]) return { skipped: true, relativePath };

  const publicId = 'madaspot' + relativePath
    .replace('/images/', '/')
    .replace(/\.[^.]+$/, '');

  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      public_id: publicId,
      overwrite: false,
      resource_type: 'image',
    });

    mapping[relativePath] = result.secure_url;
    return { success: true, relativePath, url: result.secure_url };
  } catch (err) {
    const msg = err.message || err.error?.message || JSON.stringify(err);
    return { error: true, relativePath, message: msg, size };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // First check account usage
  try {
    const usage = await cloudinary.api.usage();
    console.log(`Cloudinary usage: ${(usage.storage.usage / 1024 / 1024).toFixed(1)}MB / ${(usage.storage.limit / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Transformations: ${usage.transformations.usage} / ${usage.transformations.limit}`);
  } catch (e) {
    console.log('Could not fetch usage:', e.message);
  }

  console.log('\nScanning images...');
  const images = getAllImages(PUBLIC_DIR);
  const totalSize = images.reduce((s, i) => s + i.size, 0);
  console.log(`Found ${images.length} images (${(totalSize / 1024 / 1024).toFixed(1)}MB total)`);

  const toUpload = images.filter(img => !mapping[img.relativePath]);
  console.log(`${toUpload.length} to upload, ${images.length - toUpload.length} already done\n`);

  let uploaded = 0, errors = 0;

  // Upload one at a time with delay to avoid rate limits
  for (let i = 0; i < toUpload.length; i++) {
    const img = toUpload[i];
    const sizeMB = (img.size / 1024 / 1024).toFixed(1);

    const result = await uploadOne(img);

    if (result.success) {
      uploaded++;
      console.log(`[${uploaded + Object.keys(mapping).length - uploaded}/${images.length}] ✓ ${result.relativePath} (${sizeMB}MB)`);
    } else if (result.error) {
      errors++;
      console.log(`[ERROR] ✗ ${result.relativePath} (${sizeMB}MB): ${result.message}`);

      // If we hit a quota/rate limit, stop
      if (result.message.includes('limit') || result.message.includes('quota') || result.message.includes('plan')) {
        console.log('\n⚠️  Hit Cloudinary limit. Stopping.');
        break;
      }
    }

    // Save mapping every 10 uploads
    if (uploaded % 10 === 0) {
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
    }

    // Small delay between uploads
    if (i < toUpload.length - 1) await sleep(200);
  }

  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  console.log(`\nDone! ${uploaded} uploaded, ${errors} errors`);
  console.log(`Total mapped: ${Object.keys(mapping).length}/${images.length}`);
}

main().catch(console.error);
