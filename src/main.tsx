import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.tsx";
import { QueryProvider } from "./providers/QueryProvider";
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <Analytics />
      <App />
    </QueryProvider>
  </StrictMode>
);
