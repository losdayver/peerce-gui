import type { ComponentPropsWithoutRef } from "react";

export type ButtonProps = ComponentPropsWithoutRef<"button">;

export const Button: React.FC<ButtonProps> = ({
  className,
  type = "button",
  ...props
}) => (
  <button
    {...props}
    className={`intrinsic-button${className ? ` ${className}` : ""}`}
    type={type}
  />
);
