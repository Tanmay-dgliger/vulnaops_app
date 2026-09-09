interface HawkEyeLogoProps {
  size?: number;
  className?: string;
}

/**
 * Two-eye "hawk eye" brand mark: a pair of circular eyes with a dark hooded
 * brow over the top, an amber iris, and a black pupil.
 */
export default function HawkEyeLogo({ size = 28, className }: HawkEyeLogoProps) {
  return (
    <svg width={size} height={(size * 32) / 70} viewBox="0 0 70 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id="hawkeye-left-clip">
          <circle cx="16" cy="16" r="14.5" />
        </clipPath>
        <clipPath id="hawkeye-right-clip">
          <circle cx="54" cy="16" r="14.5" />
        </clipPath>
      </defs>

      {/* Left eye */}
      <g clipPath="url(#hawkeye-left-clip)">
        <circle cx="16" cy="16" r="14.5" fill="#FAFAFA" />
        <path d="M0.5,12 Q16,-3 31.5,12 L31.5,-1 L0.5,-1 Z" fill="#242424" />
        <ellipse cx="16" cy="19.5" rx="8.4" ry="5.6" fill="#E8B84B" />
        <circle cx="16" cy="20.2" r="3" fill="#141414" />
      </g>
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="#242424" strokeWidth="2" />

      {/* Right eye */}
      <g clipPath="url(#hawkeye-right-clip)">
        <circle cx="54" cy="16" r="14.5" fill="#FAFAFA" />
        <path d="M38.5,12 Q54,-3 69.5,12 L69.5,-1 L38.5,-1 Z" fill="#242424" />
        <ellipse cx="54" cy="19.5" rx="8.4" ry="5.6" fill="#E8B84B" />
        <circle cx="54" cy="20.2" r="3" fill="#141414" />
      </g>
      <circle cx="54" cy="16" r="14.5" fill="none" stroke="#242424" strokeWidth="2" />
    </svg>
  );
}
