import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`paper-card relative transition-all ${className}`}
      {...props}
    />
  );
}
