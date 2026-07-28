import type { ComponentPropsWithoutRef } from "react";

export type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export const Checkbox: React.FC<CheckboxProps> = ({ className, ...props }) => (
  <input
    {...props}
    className={`intrinsic-checkbox${className ? ` ${className}` : ""}`}
    type="checkbox"
  />
);
