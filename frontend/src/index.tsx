import { createRoot } from "react-dom/client";
import { App } from "@main/app";

const rootDiv = document.querySelector<HTMLDivElement>("#root");
const root = createRoot(rootDiv!);
root.render(<App />);
