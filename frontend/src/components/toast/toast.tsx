import {
  createRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

const toastLifetimeMs = 2500;
let nextToastKey = 0;

const toastHandlerRef = createRef<ToastMessageHandler>();
const initializeToastContainer = () => {
  const container = createRoot(document.getElementById("toast-container")!);
  const element = <ToastContainer ref={toastHandlerRef} />;
  container.render(element);
};

export interface ToastMessage {
  title: string;
  content?: React.ReactNode;
}

export interface ToastMessageHandler {
  addMessage: (message: ToastMessage & { key: string }) => void;
}

const ToastContainer = forwardRef<ToastMessageHandler>(({}, ref) => {
  const [messages, setMessages] = useState<(ToastMessage & { key: string })[]>(
    []
  );

  useImperativeHandle(
    ref,
    () =>
      ({
        addMessage(message: ToastMessage & { key: string }) {
          setMessages((currentMessages) => [...currentMessages, message]);
        },
      }) satisfies ToastMessageHandler,
    []
  );

  return (
    <div className="toast">
      {messages.map((msg) => (
        <ToastMessageItem
          key={msg.key}
          message={msg}
          onRemove={(key) =>
            setMessages((currentMessages) =>
              currentMessages.filter((message) => message.key !== key)
            )
          }
        />
      ))}
    </div>
  );
});

interface ToastMessageItemProps {
  message: ToastMessage & { key: string };
  onRemove: (key: string) => void;
}

const ToastMessageItem = ({ message, onRemove }: ToastMessageItemProps) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setClosing(true), toastLifetimeMs);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`toast__message${closing ? " toast__message--closing" : ""}`}
      role="status"
      onAnimationEnd={(event) => {
        if (
          closing &&
          event.target === event.currentTarget &&
          event.animationName === "toast-exit"
        ) {
          onRemove(message.key);
        }
      }}
    >
      <div className="toast__message__title">{message.title}</div>
      {message.content && (
        <div className="toast__message__content">{message.content}</div>
      )}
    </div>
  );
};

initializeToastContainer();

export const showToastMessage = (message: ToastMessage) => {
  const handler = toastHandlerRef?.current;
  if (!handler) return;
  handler.addMessage({ ...message, key: String(++nextToastKey) });
};
