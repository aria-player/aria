import {
  useContextMenu,
  type UseContextMenuParams,
  type ShowContextMenuParams,
} from "react-contexify";

export function useNativeContextMenu(params?: Partial<UseContextMenuParams>) {
  const { show: contexifyShow, hideAll } = useContextMenu(
    params as UseContextMenuParams
  );

  const show = (
    p: Omit<ShowContextMenuParams, "id"> & {
      id?: ShowContextMenuParams["id"];
    }
  ) => {
    if ((p.event as MouseEvent)?.shiftKey) return;
    contexifyShow(p as ShowContextMenuParams);
  };

  return { show, hideAll };
}
