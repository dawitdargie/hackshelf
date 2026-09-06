import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`terminal-panel relative rounded-lg shadow-card ${className}`}
      {...props}
    />
  );
}
