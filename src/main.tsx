import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "./lib/attribution";
import { initAnalytics } from "./lib/analytics";

captureAttribution();
initAnalytics(); // loads GA4 only if the visitor already accepted cookies

createRoot(document.getElementById("root")!).render(<App />);
