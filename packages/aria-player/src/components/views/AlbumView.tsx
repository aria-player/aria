import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { useDispatch, useSelector } from "react-redux";
import { selectVisibleSelectedTrackGroup } from "../../features/visibleSelectors";
import { parseAlbumId } from "../../app/utils";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { useEffect, useState } from "react";
import { addTracks } from "../../features/tracks/tracksSlice";
import LoadingSpinner from "./subviews/LoadingSpinner";

export default function AlbumView() {
  const dispatch = useDispatch();
  const albumId = useSelector(selectVisibleSelectedTrackGroup);
  const { onScroll } = useScrollDetection();
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Determine if we already have the full album before deciding to load
  useEffect(() => {
    async function fetchAlbumTracks() {
      if (albumId) {
        const albumInfo = parseAlbumId(albumId);
        const plugin = albumInfo?.source;
        if (plugin) {
          const handle = getSourceHandle(plugin);
          if (handle && handle?.getAlbumTracks) {
            setIsLoading(true);
            const tracks = await handle.getAlbumTracks(albumInfo.uri);
            dispatch(
              addTracks({
                source: plugin,
                tracks: tracks,
                addToLibrary: false
              })
            );
            setIsLoading(false);
          }
        }
      }
    }
    fetchAlbumTracks();
  }, [dispatch, albumId]);

  return (
    <div
      className="ag-overrides-album-view"
      style={{ height: "100%", width: "100%" }}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <AlbumTrackList
          onBodyScroll={(e) => {
            onScroll(e.top);
          }}
        />
      )}
    </div>
  );
}
