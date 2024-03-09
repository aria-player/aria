import { useAppSelector } from "../../app/hooks";
import { selectPlaylistsLayoutItemById } from "../../features/playlists/playlistsSlice";
import {
  selectVisiblePlaylist,
  selectVisiblePlaylistConfig,
  selectVisibleTracks
} from "../../features/visibleSelectors";

export default function DebugView() {
  const visibleTracks = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const playlistName = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, visiblePlaylist?.id ?? "")
  )?.name;
  const playlistConfig = useAppSelector(selectVisiblePlaylistConfig);

  return (
    <div style={{ overflow: "scroll" }}>
      <h3>Playlist Debug View</h3>
      <b>Name: </b>
      <br />
      &quot;{playlistName}&quot;
      <br />
      <b>ID:</b>
      <br />
      {playlistConfig?.id}
      <br />
      <b>{visibleTracks.length} tracks:</b>
      {visibleTracks.map((track) => {
        return <div key={track.itemId}>{track.title}</div>;
      })}
    </div>
  );
}
