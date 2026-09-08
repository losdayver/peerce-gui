import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@intrinsic/button";

type ModalPhase = "closed" | "opening" | "open" | "closing";

export interface ModalProps {
  onClose?: () => void;
  open?: boolean;
  title?: string;
  style?: React.CSSProperties;
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  open,
  onClose,
  children,
  title,
  style,
}) => {
  const modalContainer =
    document.querySelector<HTMLDivElement>("#modal-container")!;
  const modalRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ModalPhase>(open ? "opening" : "closed");

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

  useEffect(() => {
    if (phase !== "open" || !onClose) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat
      ) {
        return;
      }

      const visibleModals =
        modalContainer.querySelectorAll<HTMLDivElement>(".modal--visible");
      const topModal = visibleModals.item(visibleModals.length - 1);
      if (topModal !== modalRef.current) return;

      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalContainer, onClose, phase]);

  if (phase === "closed") return null;

  const visible = phase === "open";

  return createPortal(
    <div
      ref={modalRef}
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
      <div
        className="modal__dialog"
        role="dialog"
        aria-modal="true"
        style={style}
      >
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
