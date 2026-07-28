import { open } from "@tauri-apps/plugin-dialog";
import { useState, type ComponentPropsWithoutRef } from "react";

export interface FileInputProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "onClick" | "type"
> {
  accept?: string;
  onPathChange: (path: string) => void;
}

export const FileInput: React.FC<FileInputProps> = ({
  accept,
  className,
  disabled,
  onPathChange,
  ...props
}) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const selectFile = async (): Promise<void> => {
    try {
      const extensions = accept
        ?.split(",")
        .map((extension) => extension.trim().replace(/^\./, ""))
        .filter(Boolean);
      const path = await open({
        multiple: false,
        directory: false,
        filters: extensions?.length
          ? [{ name: "Allowed files", extensions }]
          : undefined,
      });

      if (typeof path !== "string") return;

      setSelectedPath(path);
      onPathChange(path);
    } catch (error) {
      console.error("Could not open the native file dialog", error);
    }
  };

  return (
    <button
      {...props}
      className={`intrinsic-file-input${className ? ` ${className}` : ""}`}
      disabled={disabled}
      onClick={() => void selectFile()}
      title={selectedPath ?? undefined}
      type="button"
    >
      {selectedPath?.slice(0, 50) ?? "Choose file"}
    </button>
  );
};
