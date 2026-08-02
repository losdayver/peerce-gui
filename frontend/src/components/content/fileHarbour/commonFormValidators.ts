import { ItemDescriptor } from "@components/form/form";

export const tagFormValidator: ItemDescriptor["validator"] = (
  value: string
) => {
  if (value?.length < 20 || value?.length > 50)
    return {
      severity: "error",
      message: "Tag length has to be between 20 and 50 symbols",
    };
};

export const addressFormValidator: ItemDescriptor["validator"] = (
  value: string
) => {
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value))
    return {
      severity: "error",
      message: "Does not satisfy IPv4 address notation",
    };
};

export const portFormValidator: ItemDescriptor["validator"] = (
  value: number
) => {
  if (value > 65525 || value < 1)
    return {
      severity: "error",
      message: "Port has to be no larger than 65525",
    };
};
