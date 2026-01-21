import { useContext, useEffect, useMemo, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import styles from "./ArtistArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { ArtistDetails } from "../../../features/artists/artistsTypes";

export const ArtistArt = ({ artist }: { artist: ArtistDetails }) => {
  const { artworkCache, artistArtworkCache, cacheArtwork, cacheArtistArtwork } =
    useContext(ArtworkContext);
  const [fetchedArtwork, setFetchedArtwork] = useState<string | null>(null);

  const artworkUri = artist?.artworkUri;
  const fallbackArtworkUri = artist?.firstTrackArtworkUri;
  const source = artist?.source;

  const artwork = useMemo(() => {
    if (artworkUri) {
      return artistArtworkCache[artworkUri] || fetchedArtwork;
    }
    if (fallbackArtworkUri) {
      return artworkCache[fallbackArtworkUri] || fetchedArtwork;
    }
    return null;
  }, [
    artworkUri,
    artistArtworkCache,
    fallbackArtworkUri,
    artworkCache,
    fetchedArtwork
  ]);

  useEffect(() => {
    if (!artworkUri || !source) {
      setFetchedArtwork(null);
      return;
    }
    if (artistArtworkCache[artworkUri]) {
      return;
    }
    const handle = getSourceHandle(source);
    if (handle?.getArtistArtwork) {
      handle.getArtistArtwork(artworkUri).then((artistArtwork) => {
        if (artistArtwork) {
          setFetchedArtwork(artistArtwork);
          cacheArtistArtwork(artworkUri, artistArtwork);
        }
      });
      return;
    }
    if (fallbackArtworkUri) {
      if (artworkCache[fallbackArtworkUri]) {
        return;
      }
      if (handle?.getTrackArtwork) {
        handle.getTrackArtwork(fallbackArtworkUri).then((coverArtData) => {
          if (coverArtData) {
            setFetchedArtwork(coverArtData);
            cacheArtwork(fallbackArtworkUri, coverArtData);
          }
        });
      }
    }
  }, [
    artworkUri,
    fallbackArtworkUri,
    source,
    artworkCache,
    artistArtworkCache,
    cacheArtwork,
    cacheArtistArtwork
  ]);

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
