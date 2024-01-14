import { useCallback, useContext } from "react";
import { useAppDispatch } from "../app/hooks";
import { handleMenuAction } from "../app/menu";
import { GridContext } from "../contexts/GridContext";

export function useMenuActions() {
  const dispatch = useAppDispatch();
  const { gridRef } = useContext(GridContext);

  const invokeMenuAction = useCallback(
    (action: string) => {
      handleMenuAction(action, dispatch, gridRef?.current?.api);
    },
    [dispatch, gridRef]
  );

  return { invokeMenuAction };
}
