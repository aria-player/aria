import { useCallback, useContext } from "react";
import { useAppDispatch } from "../app/hooks";
import { handleMenuAction, MenuItemState, selectMenuState } from "../app/menu";
import { GridContext } from "../contexts/GridContext";
import { store } from "../app/store";

export function useMenuActions() {
  const dispatch = useAppDispatch();
  const { gridRef } = useContext(GridContext);

  const invokeMenuAction = useCallback(
    (action: string) => {
      if (
        !(
          selectMenuState(store.getState())[
            action as keyof ReturnType<typeof selectMenuState>
          ] as MenuItemState
        )?.disabled
      )
        handleMenuAction(action, dispatch, gridRef?.current);
    },
    [dispatch, gridRef]
  );

  return { invokeMenuAction };
}
