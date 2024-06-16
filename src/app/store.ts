import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import configReducer from "../features/config/configSlice";
import playerReducer from "../features/player/playerSlice";
import libraryReducer from "../features/library/librarySlice";
import pluginsReducer from "../features/plugins/pluginsSlice";
import playlistsReducer from "../features/playlists/playlistsSlice";
import tracksReducer from "../features/tracks/tracksSlice";
import searchReducer from "../features/search/searchSlice";
import localforage from "localforage";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore
} from "redux-persist";
import { Reducer, combineReducers } from "redux";
import { createReduxHistoryContext } from "redux-first-history";
import { createBrowserHistory } from "history";
import { listenerMiddleware } from "./listener";
import undoable, { includeAction } from "redux-undo";
import { excludeStateFromUndo, undoableActions } from "./undo";

const storage = localforage;

const { createReduxHistory, routerMiddleware, routerReducer } =
  createReduxHistoryContext({
    history: createBrowserHistory(),
    reduxTravelling: true
  });

const undoableSlices = undoable(
  combineReducers({
    library: persistReducer({ key: "library", storage }, libraryReducer),
    playlists: persistReducer({ key: "playlists", storage }, playlistsReducer)
  }),
  {
    filter: includeAction(undoableActions.map((action) => action.type)),
    ignoreInitialState: true,
    syncFilter: true
  }
);

const reducer = combineReducers({
  router: routerReducer,
  config: persistReducer({ key: "config", storage }, configReducer),
  player: persistReducer(
    {
      key: "player",
      storage,
      blacklist: ["status"]
    },
    playerReducer
  ),
  plugins: persistReducer({ key: "plugins", storage }, pluginsReducer),
  tracks: persistReducer(
    {
      key: "tracks",
      storage,
      blacklist: ["selectedTracks", "clipboard"]
    },
    tracksReducer
  ),
  search: persistReducer(
    {
      key: "search",
      storage,
      blacklist: ["search"]
    },
    searchReducer
  ),
  undoable: excludeStateFromUndo(undoableSlices) as Reducer<UndoableSlices>
});

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat([routerMiddleware, listenerMiddleware.middleware])
});

export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<typeof store.getState>;
export type UndoableSlices = ReturnType<typeof undoableSlices>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const persistor = persistStore(store);

export const history = createReduxHistory(store);
