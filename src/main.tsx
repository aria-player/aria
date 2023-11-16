import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { persistor, history, store } from "./app/store";
import { PersistGate } from "redux-persist/integration/react";
import { HistoryRouter } from "redux-first-history/rr6";
import App from "./App";
import "./styles.css";
import "./themes/importThemes";
import { PlatformProvider } from "./contexts/PlatformContext";
import { BASEPATH } from "./app/constants";
import "./i18n";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <HistoryRouter history={history} basename={BASEPATH}>
          <PlatformProvider>
            <App />
          </PlatformProvider>
        </HistoryRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
