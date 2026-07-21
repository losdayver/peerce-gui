import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./intrinsic/Button";

export interface ModalProps {
  onClose: () => void;
  open?: boolean;
  title?: string;
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  open,
  onClose,
  children,
  title,
}) => {
  const modalContainer =
    document.querySelector<HTMLDivElement>("#modal-container")!;

  useEffect(() => {
    if (open) modalContainer.style.visibility = "visible";
    return () => {
      modalContainer.style.visibility = "hidden";
    };
  }, [open]);

  return open ? (
    createPortal(
      <div className="modal">
        <div className="modal__dialog" role="dialog" aria-modal="true">
          <div className="modal__header">
            <span>{title ?? ""}</span>
            <Button
              aria-label="Close dialog"
              onClick={onClose}
            >
              X
            </Button>
          </div>
          <div className="modal__content">{children}</div>
        </div>
      </div>,
      modalContainer
    )
  ) : (
    <></>
  );
};
