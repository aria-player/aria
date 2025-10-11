import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import styles from "./ArtistArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { ArtistDetails } from "../../../features/tracks/tracksTypes";

export const ArtistArt = ({ artist }: { artist: ArtistDetails }) => {
  const { artworkCache, artistArtworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState<string | null>(null);

  useEffect(() => {
    if (artist.artworkUri && artistArtworkCache[artist.artworkUri]) {
      setArtwork(artistArtworkCache[artist.artworkUri]);
      return;
    }
    if (artist.artworkUri) {
      const pluginHandle = getSourceHandle(artist.source);
      if (pluginHandle?.getArtistArtwork) {
        pluginHandle
          .getArtistArtwork(artist.artworkUri)
          .then((artistArtwork) => {
            setArtwork(artistArtwork ?? null);
            return;
          });
      }
    }
    if (
      artist.firstTrackArtworkUri &&
      artworkCache[artist.firstTrackArtworkUri]
    ) {
      setArtwork(artworkCache[artist.firstTrackArtworkUri]);
      return;
    }
    if (
      artist.firstTrackArtworkUri &&
      getSourceHandle(artist.source)?.getTrackArtwork != undefined
    ) {
      getSourceHandle(artist.source)
        ?.getTrackArtwork?.(artist.firstTrackArtworkUri)
        .then((coverArtData) => {
          setArtwork(coverArtData ?? null);
          return;
        });
    }
    setArtwork(null);
  }, [artworkCache, artistArtworkCache, artist]);

  return artwork ? (
    <img
      className={`album-art ${styles.artwork}`}
      src={artwork}
      alt={artist?.name}
    />
  ) : (
    <MusicIcon className={`album-art ${styles.artwork}`} title={artist?.name} />
  );
};
