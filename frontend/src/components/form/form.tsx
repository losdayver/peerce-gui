import { useState } from "react";
import { componentFactory, FormItem } from "./formItem";
import { InputProps } from "@intrinsic/input";
import { CheckboxProps } from "@intrinsic/checkbox";
import { FileInputProps } from "@intrinsic/fileInput";
import { Button } from "@intrinsic/button";

export type ItemDescriptor = (
  | InputItemDescriptor
  | CheckBoxItemDescriptor
  | FileInputItemDescriptor
) & {
  title: string;
  required?: boolean;
  divideAfter?: boolean;
  // customValidator?: (value: any) => boolean; // todo
};

interface InputItemDescriptor extends InputProps {
  component: "input";
}

interface CheckBoxItemDescriptor extends CheckboxProps {
  component: "checkbox";
}

interface FileInputItemDescriptor extends Omit<FileInputProps, "onPathChange"> {
  component: "file";
}

interface ComponentToTypeMap {
  input: string;
  checkbox: boolean;
  file: string;
}

export type FormSchema<KeysType extends object = Record<string, unknown>> =
  Record<keyof KeysType, ItemDescriptor>;

export type InferDataFromSchema<Schema extends FormSchema> = {
  [Key in keyof Schema]: ComponentToTypeMap[Schema[Key]["component"]];
};

export interface FormProps<Schema extends FormSchema> {
  schema: Schema;
  data?: InferDataFromSchema<Schema>;
  onConfirm?: (data: Partial<InferDataFromSchema<Schema>>) => void;
  customValidate?: (data: Partial<InferDataFromSchema<Schema>>) => boolean;
}

export const Form = <Schema extends FormSchema>({
  schema,
  data,
  onConfirm,
  customValidate,
}: FormProps<Schema>) => {
  const [formData, setFormData] = useState<
    Partial<InferDataFromSchema<Schema>>
  >(data ?? {});

  const validate = () => {
    const requiredKeys = Object.entries(schema)
      .filter(([fldKey, descriptor]) => descriptor.required)
      .map(([fldKey]) => fldKey);

    return requiredKeys.every((fldKey) => formData[fldKey]);
  };

  return (
    <form className="form">
      {Object.entries(schema).map(([fldKey, descriptor]) => (
        <FormItem
          title={descriptor.title}
          required={descriptor.required}
          key={fldKey}
          divideAfter={descriptor.divideAfter}
        >
          {componentFactory(descriptor, formData[fldKey], (val: any) =>
            setFormData((prev) => {
              return { ...prev, [fldKey]: val };
            })
          )}
        </FormItem>
      ))}
      <Button
        className="form__submit"
        onClick={() =>
          validate() &&
          (customValidate ? customValidate(formData) : true) &&
          onConfirm?.(formData)
        }
      >
        Confirm
      </Button>
    </form>
  );
};
