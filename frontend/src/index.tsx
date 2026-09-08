import { createRoot } from "react-dom/client";
import { App } from "@main/app";
import "./styles/styles.css";

const rootDiv = document.querySelector<HTMLDivElement>("#root");
const root = createRoot(rootDiv!);
root.render(<App />);
