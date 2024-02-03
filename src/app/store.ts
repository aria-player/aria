import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import configReducer from "../features/config/configSlice";
import playerReducer from "../features/player/playerSlice";
import libraryReducer from "../features/library/librarySlice";
import pluginsReducer from "../features/plugins/pluginsSlice";
import playlistsReducer from "../features/playlists/playlistsSlice";
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
import { combineReducers } from "redux";
import { createReduxHistoryContext } from "redux-first-history";
import { createBrowserHistory } from "history";
import { listenerMiddleware } from "./listener";

const storage = localforage;

const { createReduxHistory, routerMiddleware, routerReducer } =
  createReduxHistoryContext({
    history: createBrowserHistory(),
    reduxTravelling: true
  });

const reducer = combineReducers({
  router: routerReducer,
  config: persistReducer({ key: "config", storage }, configReducer),
  player: persistReducer(
    {
      key: "player",
      storage,
      blacklist: ["status", "queueIndex"]
    },
    playerReducer
  ),
  library: persistReducer({ key: "library", storage }, libraryReducer),
  plugins: persistReducer({ key: "plugins", storage }, pluginsReducer),
  playlists: persistReducer({ key: "playlists", storage }, playlistsReducer)
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

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const persistor = persistStore(store);

export const history = createReduxHistory(store);
