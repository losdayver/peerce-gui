import { useState } from "react";
import { componentFactory, FormItem, type FormItemNotify } from "./formItem";
import { InputProps } from "@intrinsic/input";
import { CheckboxProps } from "@intrinsic/checkbox";
import { FileInputProps } from "@intrinsic/fileInput";
import { Button } from "@intrinsic/button";

export type ItemDescriptor = (
  | InputItemDescriptor
  | CheckBoxItemDescriptor
  | FileInputItemDescriptor
  | InputNumItemDescriptor
) & {
  title: string;
  validator?: (value: any) => Omit<FormItemNotify, "fld"> | void;
  required?: boolean;
  divideAfter?: boolean;
  hint?: string;
};

interface InputItemDescriptor extends InputProps {
  component: "input";
}

interface InputNumItemDescriptor extends InputProps {
  component: "inputNum";
}

interface CheckBoxItemDescriptor extends CheckboxProps {
  component: "checkbox";
}

interface FileInputItemDescriptor extends Omit<FileInputProps, "onPathChange"> {
  component: "file";
}

interface ComponentToTypeMap {
  input: string;
  inputNum: number;
  checkbox: boolean;
  file: string;
}

export type FormSchema<KeysType extends object = Record<string, unknown>> =
  Record<Extract<keyof KeysType, string>, ItemDescriptor>;

export type InferDataFromSchema<Schema extends FormSchema> = {
  [Key in keyof Schema as Schema[Key] extends { required: true }
    ? Key
    : never]-?: ComponentToTypeMap[Schema[Key]["component"]];
} & {
  [Key in keyof Schema as Schema[Key] extends { required: true }
    ? never
    : Key]?: ComponentToTypeMap[Schema[Key]["component"]];
};

export interface FormProps<Schema extends FormSchema> {
  schema: Schema;
  initialData?: Partial<InferDataFromSchema<Schema>>;
  onConfirm?: (data: InferDataFromSchema<Schema>) => void;
  customValidate?: (
    data: Partial<InferDataFromSchema<Schema>>
  ) => FormItemNotify<Extract<keyof Schema, string>>[];
}

export const Form = <Schema extends FormSchema>({
  schema,
  initialData,
  onConfirm,
  customValidate,
}: FormProps<Schema>) => {
  const [formData, setFormData] = useState<
    Partial<InferDataFromSchema<Schema>>
  >(initialData ?? {});
  const [errors, setErrors] = useState<
    FormItemNotify<Extract<keyof Schema, string>>[]
  >([]);

  const validate = (): FormItemNotify[] => {
    const requiredKeys = Object.entries(schema)
      .filter(([_, descriptor]) => descriptor.required)
      .map(([fldKey]) => fldKey);

    const failed = requiredKeys.filter(
      (fldKey) => formData[fldKey] == null || formData[fldKey] == ""
    );
    return failed.map((fld) => ({ fld, severity: "error" }));
  };

  return (
    <form className="form">
      {Object.entries(schema).map(([fldKey, descriptor]) => {
        const error = errors.find((err) => err.fld == fldKey);
        return (
          <FormItem
            title={descriptor.title}
            required={descriptor.required}
            key={fldKey}
            divideAfter={descriptor.divideAfter}
            notify={error}
            hint={descriptor.hint}
          >
            {componentFactory(descriptor, formData[fldKey], (val: any) =>
              setFormData((prev) =>
                Object.is(prev[fldKey], val) ? prev : { ...prev, [fldKey]: val }
              )
            )}
          </FormItem>
        );
      })}
      <Button
        className="form__submit"
        onClick={() => {
          let errorsToSet = new Map<string, FormItemNotify>();

          const simpleValidateErrors = validate();
          simpleValidateErrors.forEach((error) =>
            errorsToSet.set(error.fld, error)
          );

          const customRes = customValidate?.(formData);
          if (customRes instanceof Array)
            customRes.forEach((error) => errorsToSet.set(error.fld, error));

          Object.entries(schema).forEach(([fldKey, item]) => {
            if (
              item.validator &&
              (item.required || (!item.required && formData[fldKey]))
            ) {
              const error = item.validator(formData[fldKey]);
              if (error) errorsToSet.set(fldKey, { ...error, fld: fldKey });
            }
          });

          const errors = [...errorsToSet.values()];
          if (errors.length) setErrors(errors as any);

          !errors.length &&
            onConfirm?.(formData as InferDataFromSchema<Schema>);
        }}
      >
        Confirm
      </Button>
    </form>
  );
};
