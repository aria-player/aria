import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { useDispatch } from "react-redux";
import { selectVisibleSelectedTrackGroup } from "../../features/visibleSelectors";
import { parseAlbumId } from "../../app/utils";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { useEffect, useState } from "react";
import { addTracks } from "../../features/tracks/tracksSlice";
import {
  markAlbumFetched,
  selectIsAlbumFetched
} from "../../features/cache/cacheSlice";
import LoadingSpinner from "./subviews/LoadingSpinner";
import { useAppSelector } from "../../app/hooks";

export default function AlbumView() {
  const dispatch = useDispatch();
  const albumId = useAppSelector(selectVisibleSelectedTrackGroup);
  const isAlbumCached = useAppSelector((state) =>
    selectIsAlbumFetched(state, albumId ?? "")
  );
  const { onScroll } = useScrollDetection();
  const albumInfo = albumId ? parseAlbumId(albumId) : null;
  const handle = albumInfo?.source ? getSourceHandle(albumInfo?.source) : null;
  const needsFetch = !isAlbumCached && !!(handle && handle.getAlbumTracks);
  const [isLoading, setIsLoading] = useState(needsFetch);

  useEffect(() => {
    async function fetchAlbumTracks() {
      if (albumId) {
        const albumInfo = parseAlbumId(albumId);
        const plugin = albumInfo?.source;
        if (plugin) {
          const handle = getSourceHandle(plugin);
          if (handle && handle?.getAlbumTracks) {
            if (!isAlbumCached) {
              setIsLoading(true);
            }
            const tracks = await handle.getAlbumTracks(albumInfo.uri);
            dispatch(
              addTracks({
                source: plugin,
                tracks: tracks,
                addToLibrary: false
              })
            );
            dispatch(markAlbumFetched(albumId));
            setIsLoading(false);
          }
        }
      }
    }
    fetchAlbumTracks();
  }, [dispatch, albumId, isAlbumCached]);

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
