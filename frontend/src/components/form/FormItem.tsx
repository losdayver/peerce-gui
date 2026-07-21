import { ReactNode } from "react";
import { ItemDescriptor } from "./Form";
import { Input } from "../intrinsic/Input";
import { Checkbox } from "../intrinsic/Checkbox";

export interface FormItemProps {
  title: string;
  required?: boolean;
  key?: string;
  divideAfter?: boolean;
}

export const FormItem: React.FC<React.PropsWithChildren<FormItemProps>> = ({
  children,
  required,
  title,
  key,
  divideAfter,
}) => {
  return (
    <div className="form__item" key={key}>
      <span className="form__label">
        {title}:
        {required && (
          <span className="form__required" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <span className="form__control">{children}</span>
      {divideAfter && <hr className="form__divider" />}
    </div>
  );
};

export const componentFactory = (
  descriptor: ItemDescriptor,
  onChange: (val: any) => void
) => {
  switch (descriptor.component) {
    case "input":
      return (
        <Input
          {...descriptor}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "checkbox":
      return (
        <Checkbox
          {...descriptor}
          onChange={(event) => onChange(event.target.checked)}
        />
      );
    default:
      return <></>;
  }
};
