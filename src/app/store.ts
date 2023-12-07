import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import configReducer from "../features/config/configSlice";
import libraryReducer from "../features/library/librarySlice";
import pluginsReducer from "../features/plugins/pluginsSlice";
import storage from "redux-persist/lib/storage";
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
import { pluginsListener } from "../features/plugins/pluginsListener";

const { createReduxHistory, routerMiddleware, routerReducer } =
  createReduxHistoryContext({
    history: createBrowserHistory(),
    reduxTravelling: true
  });

export const store = configureStore({
  reducer: combineReducers({
    router: routerReducer,
    config: persistReducer({ key: "config", storage }, configReducer),
    library: persistReducer({ key: "library", storage }, libraryReducer),
    plugins: persistReducer({ key: "plugins", storage }, pluginsReducer)
  }),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat([routerMiddleware, pluginsListener.middleware])
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
