import {
  builtinComponentFactory,
  ComponentFactoryType,
  ItemDescriptor,
} from "formutate";
import { FileInput } from "./fileInput";

export const componentFactory: ComponentFactoryType = (
  descriptor: ItemDescriptor,
  value: any,
  onChange
) => {
  if (descriptor.component == "file") {
    return <FileInput {...descriptor} value={value} onPathChange={onChange} />;
  }
  return builtinComponentFactory(descriptor, value, onChange);
};
