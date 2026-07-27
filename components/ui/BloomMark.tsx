import React from "react";

/**
 * « La fleur EVERBLOOM » — motif signature en trait fin.
 * Dessiné en strokes (currentColor) pour se décliner partout.
 */
export default function BloomMark({
  className = "",
  strokeWidth = 1.25,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  const petale = "M60 60 C 49 36, 49 20, 60 6 C 71 20, 71 36, 60 60 Z";
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {angles.map((a) => (
        <path key={a} d={petale} transform={`rotate(${a} 60 60)`} />
      ))}
      {angles.map((a) => (
        <path
          key={`i-${a}`}
          d="M60 60 C 54 46, 54 38, 60 30 C 66 38, 66 46, 60 60 Z"
          transform={`rotate(${a + 22.5} 60 60)`}
          opacity={0.6}
        />
      ))}
      <circle cx="60" cy="60" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
