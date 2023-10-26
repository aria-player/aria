import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";
import configReducer from "../features/config/configSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "redux";
import { createReduxHistoryContext } from "redux-first-history";
import { createBrowserHistory } from "history";

const { createReduxHistory, routerMiddleware, routerReducer } =
  createReduxHistoryContext({
    history: createBrowserHistory(),
    reduxTravelling: true
  });

export const store = configureStore({
  reducer: combineReducers({
    router: routerReducer,
    counter: persistReducer({ key: "counter", storage }, counterReducer),
    config: persistReducer({ key: "config", storage }, configReducer)
  }),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(routerMiddleware)
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
