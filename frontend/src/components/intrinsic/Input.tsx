import type { ComponentPropsWithoutRef } from "react";

export type InputProps = ComponentPropsWithoutRef<"input">;

export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <input
    {...props}
    className={`intrinsic-input${className ? ` ${className}` : ""}`}
  />
);
