import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { useSelector } from "react-redux";
import { selectVisibleSelectedTrackGroup } from "../../features/visibleSelectors";
import { parseAlbumId } from "../../app/utils";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { useEffect } from "react";

export default function AlbumView() {
  const albumId = useSelector(selectVisibleSelectedTrackGroup);
  const { onScroll } = useScrollDetection();

  useEffect(() => {
    async function fetchAlbumTracks() {
      if (albumId) {
        const albumInfo = parseAlbumId(albumId);
        const plugin = albumInfo?.source;
        if (plugin) {
          const handle = getSourceHandle(plugin);
          if (handle && handle?.getAlbumTracks) {
            const tracks = await handle.getAlbumTracks(albumInfo.uri);
            console.log("Fetched external album tracks:", tracks);
          }
        }
      }
    }
    fetchAlbumTracks();
  }, [albumId]);

  return (
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
  );
}
