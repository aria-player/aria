import { useAppSelector } from "../../app/hooks";
import { DisplayMode, SearchCategory, View } from "../../app/view";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";
import { SplitView } from "./SplitView";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import ArtistGrid from "./ArtistGrid";
import ErrorPage from "../pages/ErrorPage";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useScrollDetection } from "../../hooks/useScrollDetection";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const { onScroll } = useScrollDetection();

  return (
    <>
      {visibleViewType == View.Playlist && visiblePlaylist == null && (
        <ErrorPage />
      )}
      {visibleDisplayMode == DisplayMode.TrackList && (
        <div style={{ height: "100%", width: "100%" }}>
          <TrackList />
        </div>
      )}
      {visibleDisplayMode == DisplayMode.AlbumGrid && (
        <div
          style={{
            height: "100%",
            width: "100%",
            overflow: "auto"
          }}
        >
          <AlbumGrid />
        </div>
      )}
      {visibleDisplayMode == DisplayMode.SplitView && <SplitView />}
      {visibleViewType == View.Album && (
        <div
          className="ag-overrides-album-view"
          style={{ height: "100%", width: "100%" }}
        >
          <AlbumTrackList
            onBodyScroll={(e) => {
              onScroll(e.top);
            }}
          />
        </div>
      )}
      {visibleSearchCategory == SearchCategory.Artists && <ArtistGrid />}
    </>
  );
}
