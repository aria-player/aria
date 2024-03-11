import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Platform, PlatformContext } from "./contexts/PlatformContext";
import { TestBackend } from "react-dnd-test-backend";
import { DndProvider } from "react-dnd";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

test("renders loading state by default", () => {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;

  render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );

  const loadingElement = document.querySelector("[class*='loading']");
  expect(loadingElement).toBeInTheDocument();
});

test("renders search bar when loaded", () => {
  const mockPlatform = {
    platform: Platform.Web,
    fullscreen: null,
    decorations: null,
    minimiseToTray: null,
    setDecorations: () => {},
    setMinimiseToTray: () => {}
  };
  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  render(
    <Provider store={store}>
      <BrowserRouter>
        <PlatformContext.Provider value={mockPlatform}>
          <DndProvider backend={TestBackend}>
            <App />
          </DndProvider>
        </PlatformContext.Provider>
      </BrowserRouter>
    </Provider>
  );
  const searchBar = document.querySelector("[class*='search']");
  expect(searchBar).toBeInTheDocument();
});
