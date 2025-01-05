import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { persistor, history, store } from "./app/store";
import { PersistGate } from "redux-persist/integration/react";
import { HistoryRouter } from "redux-first-history/rr6";
import { GridProvider } from "./contexts/GridContext";
import { PlatformProvider } from "./contexts/PlatformContext";
import { BASEPATH } from "./app/constants";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { MenuProvider } from "./contexts/MenuContext";
import { TreeProvider } from "./contexts/TreeContext";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { DndProvider } from "react-dnd-multi-backend";
import { ArtworkProvider } from "./contexts/ArtworkContext";
import { ErrorBoundary } from "react-error-boundary";
import { CrashPage } from "./components/pages/CrashPage";
import { isTauri } from "./app/utils";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import App from "./App";
import "./i18n";

import "allotment/dist/style.css";
import "react-contexify/dist/ReactContexify.css";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import "react-color-palette/css";

import "./styles/base.css";
import "./styles/overrides.css";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={CrashPage}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <HistoryRouter history={history} basename={BASEPATH}>
            <GridProvider>
              <TreeProvider>
                <MenuProvider>
                  <PlatformProvider>
                    <ArtworkProvider>
                      <DndProvider options={HTML5toTouch}>
                        <ErrorBoundary FallbackComponent={CrashPage}>
                          <App />
                        </ErrorBoundary>
                      </DndProvider>
                    </ArtworkProvider>
                  </PlatformProvider>
                </MenuProvider>
              </TreeProvider>
            </GridProvider>
          </HistoryRouter>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Make React available to plugins
window.React = React;
window.ReactDOM = ReactDOM;

// Allow plugins to authenticate with OAuth
if (window.location.search.includes("code")) {
  const params = new URLSearchParams(window.location.search);
  window.opener.postMessage(
    {
      type: "OAuthCode",
      code: params.get("code"),
      state: params.get("state")
    },
    window.location.origin
  );
}

if (isTauri()) {
  invoke("start_server");
  listen("oauth_code", (event) => {
    const { code, state } = event.payload as { code: string; state: string };
    window.postMessage(
      {
        type: "OAuthCode",
        code: code,
        state: state
      },
      window.location.origin
    );
    invoke("start_server");
  });
}
