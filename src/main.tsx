import React from "react";
import ReactDOM from "react-dom/client";
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
import App from "./App";
import "./i18n";

import "allotment/dist/style.css";
import "react-contexify/dist/ReactContexify.css";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";

import "./styles/base.css";
import "./styles/overrides.css";
import "./themes/importThemes";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
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
