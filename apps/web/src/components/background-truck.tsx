/**
 * Site-wide decorative background: a tiled garbage-truck pattern behind
 * every page. Fixed + negative z-index so it never affects layout or
 * intercepts clicks; low opacity (higher in dark mode, since the pattern
 * itself is a fixed mid-gray) so it reads as texture, not noise, without
 * hurting the readability of the opaque cards every page renders on top.
 */
export function BackgroundTruck() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05] dark:opacity-[0.09]"
      style={{
        backgroundImage: "url('/truck-pattern.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "220px 140px",
      }}
    />
  )
}
