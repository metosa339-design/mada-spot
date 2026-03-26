/**
 * Converts local image paths to Cloudinary URLs for production.
 * Local paths like `/images/Attractions/baobabs/allee-des-baobabs.jpg`
 * become `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/madaspot/Attractions/baobabs/allee-des-baobabs`
 */

const BASE_URL = 'https://res.cloudinary.com/dh1ksozbx/image/upload';

/**
 * Convert a local /images/... path to a Cloudinary URL.
 * - In production: returns Cloudinary URL with auto format/quality
 * - Already a full URL (http/https): returns as-is
 * - Empty/null: returns fallback
 */
export function getImageUrl(
  path: string | null | undefined,
  options?: { width?: number; height?: number; fallback?: string }
): string {
  const fallback = options?.fallback || '/placeholder.jpg';

  if (!path) return fallback;

  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Not a local image path — return as-is
  if (!path.startsWith('/images/')) {
    return path;
  }

  // Build Cloudinary URL
  // /images/Attractions/baobabs/allee-des-baobabs.jpg → madaspot/Attractions/baobabs/allee-des-baobabs
  const publicId = 'madaspot' + path
    .replace('/images/', '/')
    .replace(/\.[^.]+$/, ''); // remove extension

  // Build transformation string
  const transforms = ['f_auto', 'q_auto'];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);

  return `${BASE_URL}/${transforms.join(',')}/${publicId}`;
}

/**
 * Convert an array of image paths to Cloudinary URLs.
 */
export function getImageUrls(
  paths: string[] | string | null | undefined,
  options?: { width?: number; height?: number; fallback?: string }
): string[] {
  if (!paths) return [];
  const arr = typeof paths === 'string' ? safeParseImages(paths) : paths;
  return arr.map((p) => getImageUrl(p, options));
}

/**
 * Safely parse images field (can be JSON string array or comma-separated string).
 */
function safeParseImages(value: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [value];
  } catch {
    return value.includes(',') ? value.split(',').map((s) => s.trim()) : [value];
  }
}
