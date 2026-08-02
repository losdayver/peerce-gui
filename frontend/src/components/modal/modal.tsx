import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@intrinsic/button";

type ModalPhase = "closed" | "opening" | "open" | "closing";

export interface ModalProps {
  onClose?: () => void;
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
  const [phase, setPhase] = useState<ModalPhase>(
    open ? "opening" : "closed"
  );

  useEffect(() => {
    setPhase((currentPhase) => {
      if (open) {
        if (currentPhase === "closed") return "opening";
        return currentPhase === "closing" ? "open" : currentPhase;
      }

      if (currentPhase === "opening") return "closed";
      return currentPhase === "open" ? "closing" : currentPhase;
    });
  }, [open]);

  useEffect(() => {
    if (phase !== "opening") return;

    const animationFrame = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(animationFrame);
  }, [phase]);

  if (phase === "closed") return null;

  const visible = phase === "open";

  return createPortal(
    <div
      className={`modal${visible ? " modal--visible" : ""}`}
      aria-hidden={!visible}
      onTransitionEnd={(event) => {
        if (
          phase === "closing" &&
          event.target === event.currentTarget &&
          event.propertyName === "opacity"
        ) {
          setPhase("closed");
        }
      }}
    >
      <div className="modal__dialog" role="dialog" aria-modal="true">
        <div className="modal__header">
          <span>{title ?? ""}</span>
          <Button aria-label="Close dialog" onClick={onClose}>
            X
          </Button>
        </div>
        <div className="modal__content">{children}</div>
      </div>
    </div>,
    modalContainer
  );
};
