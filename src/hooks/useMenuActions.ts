import { useCallback } from "react";
import { useAppDispatch } from "../app/hooks";
import { handleMenuAction } from "../app/menu";

export function useMenuActions() {
  const dispatch = useAppDispatch();

  const invokeMenuAction = useCallback(
    (action: string) => {
      handleMenuAction(action, dispatch);
    },
    [dispatch]
  );

  return { invokeMenuAction };
}
