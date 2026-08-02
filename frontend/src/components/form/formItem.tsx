import { ItemDescriptor } from "./form";
import { Input } from "@intrinsic/input";
import { Checkbox } from "@intrinsic/checkbox";
import { FileInput } from "@intrinsic/fileInput";

export interface FormItemProps {
  title: string;
  required?: boolean;
  key?: string;
  divideAfter?: boolean;
  notify?: FormItemNotify;
}

export interface FormItemNotify<Keys extends string = string> {
  fld: Keys;
  severity: "warning" | "error";
  message?: string;
}

export const FormItem: React.FC<React.PropsWithChildren<FormItemProps>> = ({
  children,
  required,
  title,
  key,
  divideAfter,
  notify,
}) => {
  return (
    <div className={`form__item ${notify ? notify.severity : ""}`} key={key}>
      <span className="form__label">
        {title}:
        {required && (
          <span className="form__required" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <span
        className={`form__control${notify?.message ? " form__control--with-message" : ""}`}
      >
        {children}
        {notify?.message && (
          <span
            className="form__message"
            role={notify.severity === "error" ? "alert" : "status"}
          >
            {notify.message}
          </span>
        )}
      </span>
      {divideAfter && <hr className="form__divider" />}
    </div>
  );
};

export const componentFactory = (
  descriptor: ItemDescriptor,
  value: any,
  onChange: (val: any) => void
) => {
  switch (descriptor.component) {
    case "input":
      return (
        <Input
          {...descriptor}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "inputNum":
      return (
        <Input
          {...descriptor}
          value={value ?? ""}
          onChange={(event) => {
            const value = event.target.value?.replace(/\D/g, "");
            onChange(value ? Number(value) : null);
          }}
        />
      );
    case "checkbox":
      return (
        <Checkbox
          {...descriptor}
          value={value}
          onChange={(event) => onChange(event.target.checked)}
        />
      );
    case "file":
      return (
        <FileInput {...descriptor} value={value} onPathChange={onChange} />
      );
    default:
      return <></>;
  }
};
