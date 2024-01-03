import {
  TypedStartListening,
  TypedStopListening,
  createListenerMiddleware
} from "@reduxjs/toolkit";
import { RootState } from "./store";

export const listenerMiddleware = createListenerMiddleware();

export const startListening =
  listenerMiddleware.startListening as TypedStartListening<RootState>;

export const stopListening =
  listenerMiddleware.stopListening as TypedStopListening<RootState>;
