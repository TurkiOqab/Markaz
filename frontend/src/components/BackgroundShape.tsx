/**
 * Decorative brand silhouette used as a watermark across the app.
 *
 * The source asset (`/public/shape.webp`) is a white-on-transparent shape;
 * we feed it through CSS `mask-image` so the *colour* is whatever
 * `backgroundColor` we set — letting the same file work as a green watermark
 * on light pages and a darker-green silhouette on the brand panel.
 */
interface Props {
  /** Tailwind position/size classes (e.g. "absolute -bottom-56 -right-56 h-[1200px] w-[1200px]"). */
  className?: string;
  /** Any CSS color. Defaults to brand-700. */
  color?: string;
  /** 0–1. Defaults to 0.15 — visible watermark for light pages. */
  opacity?: number;
  /** Stacking order. Pass a negative value (with an `isolate` parent) to keep
   *  the shape strictly behind every other element in the parent context. */
  zIndex?: number;
}

export function BackgroundShape({
  className = "",
  color = "#1a7a3a",
  opacity = 0.15,
  zIndex,
}: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        WebkitMaskImage: "url('/shape.webp')",
        maskImage: "url('/shape.webp')",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        backgroundColor: color,
        opacity,
        zIndex,
      }}
    />
  );
}
