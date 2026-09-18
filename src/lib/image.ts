const CDN = import.meta.env.PUBLIC_IMAGE_CDN as string | undefined;

type Resize = {
  width: number;
  quality?: number;
};

/**
 * Build a resized URL for a remote original.
 *
 * Set PUBLIC_IMAGE_CDN to your image host origin, for example:
 * - Vercel Blob + `/_vercel/image?url=...&w={width}&q={quality}`
 * - Cloudflare Images
 * - Imgix / Cloudinary
 *
 * Until that env is set, the original `src` is returned unchanged.
 */
export function cdnSrc(src: string, { width, quality = 75 }: Resize): string {
  if (!CDN) return src;

  const url = new URL("/cdn-cgi/image", CDN);
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality));
  url.searchParams.set("format", "auto");
  url.searchParams.set("fit", "cover");
  url.searchParams.set("url", src);
  return url.toString();
}

export function srcset(src: string, widths: number[], quality = 75): string {
  return widths.map((width) => `${cdnSrc(src, { width, quality })} ${width}w`).join(", ");
}
