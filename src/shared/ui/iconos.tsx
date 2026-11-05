import type { LucideProps } from "lucide-react";

/**
 * Estadio para "Mi liga" (el diseño usa el ícono "stadium" de Material, que lucide no trae).
 * Mismo trazo que lucide: 24×24, stroke 2, puntas redondas.
 */
export function IconoEstadio({ size = 24, strokeWidth = 2, className, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 3v4.5" />
      <path d="M7 3l3 1.2L7 5.4" />
      <path d="M17 3v4.5" />
      <path d="M17 3l3 1.2-3 1.2" />
      <ellipse cx="12" cy="11" rx="9" ry="3.2" />
      <path d="M3 11v5.5c0 1.8 4 3.5 9 3.5s9-1.7 9-3.5V11" />
      <path d="M8 14.6v4.9" />
      <path d="M16 14.6v4.9" />
    </svg>
  );
}
