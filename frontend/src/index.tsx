import { createRoot } from "react-dom/client";
import { WsClient } from "./ws-client";
import { App } from "./components/App";

const rootDiv = document.querySelector<HTMLDivElement>("#root");
const root = createRoot(rootDiv!);
root.render(<App />);

async function connectToBackend(): Promise<void> {
  const response = await fetch("http://127.0.0.1:4310/api/health");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const ws = new WebSocket("ws://127.0.0.1:4310");
  const wsClient = new WsClient(ws);
}
await connectToBackend();
