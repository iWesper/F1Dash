/**
 * F1 Dash mark: three slanted speed stripes, each longer than the one
 * above, with broken tails on the top two.
 * Drawn on a 64-unit grid with a 12-unit margin on every side; bars are 8
 * tall with 6 between them, each steps 6.5 further left, and every tail
 * gap is 3.5. The same shapes
 * are exported to public/icon.svg (keep the two in sync).
 */
export default function Logo({ size = 28, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#e8002d" />
      <g fill="#fff">
        <path d="M35.9 14H52l-2.4 8H33.5z" />
        <path d="M25.2 28h22.6l-2.4 8H22.8z" />
        <path d="M14.4 42h29.2l-2.4 8H12z" />
        <g opacity=".6">
          <path d="M28.9 14h3.5L30 22h-3.5z" />
          <path d="M18.6 28h3.1l-2.4 8h-3.1z" />
        </g>
      </g>
    </svg>
  );
}
