import { useAppSelector } from "../../app/hooks";
import { DisplayMode, SearchCategory, View } from "../../app/view";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";
import { SplitView } from "./SplitView";
import {
  selectVisibleArtistSection,
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import ArtistGrid from "./ArtistGrid";
import ErrorPage from "../pages/ErrorPage";
import ArtistView from "./ArtistView";
import AlbumView from "./AlbumView";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleArtistSection = useAppSelector(selectVisibleArtistSection);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);

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
      {visibleViewType == View.Album && <AlbumView />}
      {visibleViewType == View.Artist && !visibleArtistSection && (
        <ArtistView />
      )}
      {visibleSearchCategory == SearchCategory.Artists && <ArtistGrid />}
    </>
  );
}
