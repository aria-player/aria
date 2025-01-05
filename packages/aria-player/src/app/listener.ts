import {
  UnknownAction,
  TypedStartListening,
  TypedStopListening,
  createListenerMiddleware
} from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "./store";

export type MatchFunction = (action: UnknownAction) => action is UnknownAction;

export const listenerMiddleware = createListenerMiddleware();

export const startListening =
  listenerMiddleware.startListening as TypedStartListening<
    RootState,
    AppDispatch
  >;

export const stopListening =
  listenerMiddleware.stopListening as TypedStopListening<
    RootState,
    AppDispatch
  >;

export const listenForChange = (
  selector: (state: RootState) => unknown,
  effect: (
    state: RootState,
    action: UnknownAction,
    dispatch: AppDispatch
  ) => void
) => {
  startListening({
    predicate: (_action, currentState, previousState) => {
      return selector(currentState) !== selector(previousState);
    },
    effect: (action, api) => {
      effect(api.getState(), action, api.dispatch);
    }
  });
};

export const listenForAction = (
  matcher: MatchFunction,
  effect: (
    state: RootState,
    action: UnknownAction,
    dispatch: AppDispatch
  ) => void
) => {
  startListening({
    matcher,
    effect: (action, api) => {
      effect(api.getState(), action as UnknownAction, api.dispatch);
    }
  });
};
