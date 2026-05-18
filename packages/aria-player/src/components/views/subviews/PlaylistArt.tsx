import { useAppSelector } from "../../../app/hooks";
import { selectPlaylistById } from "../../../features/playlists/playlistsSlice";
import { selectTrackById } from "../../../features/tracks/tracksSlice";
import { Track } from "../../../../../types/tracks";
import { AlbumArt } from "./AlbumArt";
import styles from "./PlaylistArt.module.css";

export default function PlaylistArt({ playlistId }: { playlistId: string }) {
  const playlistArtworkUri = useAppSelector(
    (state) => selectPlaylistById(state, playlistId)?.artworkUri
  );

  const artworkTracks = useAppSelector((state) => {
    if (playlistArtworkUri) return [] as Track[];
    const playlist = selectPlaylistById(state, playlistId);
    if (!playlist?.tracks.length) return [] as Track[];
    const seen = new Set<string>();
    const tracks: Track[] = [];
    for (const pt of playlist.tracks) {
      const track = selectTrackById(state, pt.trackId);
      if (!track?.artworkUri) continue;
      const key = track.albumId ?? track.artworkUri;
      if (!seen.has(key)) {
        seen.add(key);
        tracks.push(track as Track);
        if (tracks.length === 4) break;
      }
    }
    return tracks;
  });

  if (playlistArtworkUri) {
    return (
      <img
        className={`album-art ${styles.externalArtwork}`}
        src={playlistArtworkUri}
      />
    );
  }

  if (artworkTracks.length < 4) {
    return <AlbumArt track={artworkTracks[0]} />;
  }

  return (
    <div className={styles.mosaic}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={styles.mosaicItem}>
          {artworkTracks[i] && <AlbumArt track={artworkTracks[i]} />}
        </div>
      ))}
    </div>
  );
}
