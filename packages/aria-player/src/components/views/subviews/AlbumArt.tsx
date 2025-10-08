import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import { Track } from "../../../../../types/tracks";
import styles from "./AlbumArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { selectArtistInfo } from "../../../features/tracks/tracksSlice";
import { store } from "../../../app/store";

export const AlbumArt = ({
  track,
  altText,
  artistId
}: {
  track: Track | null;
  altText?: string;
  artistId?: string;
}) => {
  const { artworkCache, artistArtworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState<string | null>(null);
  useEffect(() => {
    if (track && artistId) {
      const pluginHandle = getSourceHandle(track.source);
      if (pluginHandle?.getArtistArtwork) {
        const artistInfo = selectArtistInfo(store.getState(), artistId);
        if (artistInfo) {
          if (
            artistInfo.artworkUri &&
            artistArtworkCache[artistInfo.artworkUri]
          ) {
            setArtwork(artistArtworkCache[artistInfo.artworkUri]);
            return;
          }
          pluginHandle.getArtistArtwork(artistInfo).then((artistArtwork) => {
            if (artistArtwork) {
              setArtwork(artistArtwork);
            }
          });
          return;
        }
      }
    }

    if (track && track.artworkUri && artworkCache[track.artworkUri]) {
      setArtwork(artworkCache[track.artworkUri]);
      return;
    }
    if (track && getSourceHandle(track.source)?.getTrackArtwork != undefined) {
      getSourceHandle(track.source)
        ?.getTrackArtwork?.(track)
        .then((coverArtData) => {
          setArtwork(coverArtData ?? null);
        });
    } else {
      setArtwork(null);
    }
  }, [artworkCache, artistArtworkCache, track, artistId]);

  return artwork ? (
    <img
      className={`album-art ${styles.artwork}`}
      src={artwork}
      alt={altText || track?.album}
    />
  ) : (
    <MusicIcon
      className={`album-art ${styles.artwork}`}
      title={altText || track?.album}
    />
  );
};
