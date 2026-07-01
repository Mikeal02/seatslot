const imageCache = new Set<string>();

export function preloadImage(url?: string | null) {
  if (!url) return;
  if (imageCache.has(url)) return;

  imageCache.add(url);

  

  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  img.src = url;
}

export function preloadImages(urls: (string | null | undefined)[]) {
  urls.forEach(preloadImage);
}