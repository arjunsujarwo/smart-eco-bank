import { CSSProperties } from "react";

/** Wrapper untuk Material Symbols Outlined. `fill` mengisi ikon (FILL 1). */
export default function Icon({
  name,
  className = "",
  fill = false,
  style,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined${fill ? " fill" : ""} ${className}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
