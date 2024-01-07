import {
  AnyAction,
  TypedStartListening,
  TypedStopListening,
  createListenerMiddleware
} from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "./store";
import { MatchFunction } from "@reduxjs/toolkit/dist/listenerMiddleware/types";

export const listenerMiddleware = createListenerMiddleware();

export const startListening =
  listenerMiddleware.startListening as TypedStartListening<RootState>;

export const stopListening =
  listenerMiddleware.stopListening as TypedStopListening<RootState>;

export const listenForChange = (
  selector: (state: RootState) => unknown,
  effect: (state: RootState, action: AnyAction, dispatch: AppDispatch) => void
) => {
  startListening({
    predicate: (_action, currentState, previousState) => {
      return selector(currentState) !== selector(previousState);
    },
    effect: (action, api) => {
      effect(api.getState(), action, api.dispatch as AppDispatch);
    }
  });
};

export const listenForAction = (
  matcher: MatchFunction<AnyAction>,
  effect: (state: RootState, action: AnyAction, dispatch: AppDispatch) => void
) => {
  startListening({
    matcher,
    effect: (action, api) => {
      effect(api.getState(), action, api.dispatch as AppDispatch);
    }
  });
};
