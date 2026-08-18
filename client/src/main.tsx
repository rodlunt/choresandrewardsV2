// Side-effect import FIRST: arms the beforeinstallprompt capture before
// React renders, so the install button can't lose the race to Chrome's
// one-shot event (see client/src/lib/pwa-install.ts).
import './lib/pwa-install';
import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
