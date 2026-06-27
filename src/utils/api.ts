/**
 * External API configuration
 * All C2PA and EXIF metadata requests go to the hosted verifier app.
 */
export const C2PA_API_BASE = 'https://apps.thecontrarian.in/c2pa';

const CF_IMAGE_CDN = 'https://library.thecontrarian.in';

/**
 * Build a Cloudflare Image Transformation URL.
 * Routes through the Worker at library.thecontrarian.in so that:
 *  - <img> fetches get optimised WebP/AVIF via cf.image (Worker proxies to /cdn-cgi/image/)
 *  - "Open Image in New Tab" (document navigations) hit the Worker → C2PA viewer
 * Query-param format avoids /cdn-cgi/image/ paths which Workers cannot intercept.
 */
export function cfImageUrl(src: string, width: number, quality = 85): string {
  const path = src.startsWith('/library/')
    ? src.slice('/library/'.length)
    : src.replace(/^\//, '');
  return `${CF_IMAGE_CDN}/${path}?w=${width}&q=${quality}&f=auto`;
}

/**
 * Build the full image URI for API calls.
 * Converts root-relative paths like /library/originals/... to the CDN URL
 * that the hosted API can fetch from.
 */
export function resolveImageUri(imgPath: string): string {
  let pathname: string;

  try {
    // Extract pathname for both full URLs and relative paths, stripping query parameters
    pathname = new URL(imgPath, 'http://dummy.com').pathname;
  } catch {
    pathname = imgPath;
  }

  // Convert root-relative /library/... paths to the CDN origin
  if (pathname.startsWith('/library/')) {
    return `https://library.thecontrarian.in${pathname.replace('/library', '')}`;
  }

  // Fallback: assume it's a CDN-relative path
  return `https://library.thecontrarian.in/${pathname.replace(/^\//, '')}`;
}

/**
 * Run an async mapper over a list with bounded concurrency.
 * Used to avoid hammering the hosted C2PA/EXIF API when fetching metadata
 * for many images in parallel (e.g. the home carousel has 48 images).
 * With unbounded Promise.all, most requests timed out at the 3s mark
 * because the API queues under load. Batched at 4, all 48 complete in
 * ~40s instead of returning null.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = 4
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

