import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../app/hooks";
import { DisplayMode, View } from "../../../app/view";
import {
  selectVisibleDisplayMode,
  selectVisibleViewType
} from "../../../features/visibleSelectors";

export default function NoRowsOverlay() {
  const { t } = useTranslation();
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);

  switch (visibleViewType) {
    case View.Search:
      return <div>{t("search.noResults")}</div>;
    case View.Playlist:
      return <div>{t("tracks.emptyPlaylist")}</div>;
    case View.Queue:
      return <div>{t("tracks.emptyQueue")}</div>;
    default:
      if (
        visibleDisplayMode == DisplayMode.AlbumGrid ||
        visibleDisplayMode == DisplayMode.SplitView
      ) {
        return <div>{t("albumTrackList.empty")}</div>;
      } else {
        return <div>{t("tracks.emptyLibrary")}</div>;
      }
  }
}
