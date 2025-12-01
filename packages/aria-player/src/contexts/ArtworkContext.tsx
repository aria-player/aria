import {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useCallback
} from "react";
import { useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/tracks/tracksSlice";
import {
  getSourceHandle,
  selectActivePlugins
} from "../features/plugins/pluginsSlice";
import { Track } from "../../../types/tracks";
import { useDebounce } from "react-use";
import { store } from "../app/store";
import { selectArtistsInfo } from "../features/artists/artistsSlice";

export const ArtworkContext = createContext<{
  artworkCache: Record<string, string>;
  cacheArtwork: (uri: string, data: string) => void;
  artistArtworkCache: Record<string, string>;
  // TODO: Add method for caching artist artwork once external artist search is added
}>({
  artworkCache: {},
  cacheArtwork: () => {},
  artistArtworkCache: {}
});

function filterByUniqueArtwork(array: Track[]) {
  return Object.values(
    array.reduce(
      (acc, obj) => {
        if (obj.artworkUri !== undefined) {
          acc[obj.artworkUri] = obj;
        }
        return acc;
      },
      {} as { [key: string]: Track }
    )
  );
}

const loadAllArtwork = async () => {
  const trackCache: Record<string, string> = {};
  const artistCache: Record<string, string> = {};

  for (const track of filterByUniqueArtwork(
    selectAllTracks(store.getState())
  )) {
    if (track.artworkUri) {
      const artwork = await (getSourceHandle(track.source)?.getTrackArtwork?.(
        track.artworkUri
      ) ?? Promise.resolve());
      if (artwork) trackCache[track.artworkUri] = artwork;
    }
  }
  for (const artist of Object.values(selectArtistsInfo(store.getState()))) {
    if (artist.artworkUri) {
      const pluginHandle = getSourceHandle(artist.source);
      if (pluginHandle?.getArtistArtwork) {
        const artwork = await (pluginHandle.getArtistArtwork(
          artist.artworkUri
        ) ?? Promise.resolve());
        if (artwork) artistCache[artist.artworkUri] = artwork;
      }
    }
  }
  return { trackCache, artistCache };
};

export const ArtworkProvider = ({ children }: { children: ReactNode }) => {
  const [artworkCache, setArtworkCache] = useState<Record<string, string>>({});
  const [artistArtworkCache, setArtistArtworkCache] = useState<
    Record<string, string>
  >({});
  const allTracks = useAppSelector(selectAllTracks);
  const artistsInfo = useAppSelector(selectArtistsInfo);
  const activePlugins = useAppSelector(selectActivePlugins);

  const cacheArtwork = useCallback((uri: string, data: string) => {
    if (!uri || !data) return;
    setArtworkCache((prev) => {
      if (prev[uri]) return prev;
      return {
        ...prev,
        [uri]: data
      };
    });
  }, []);

  useDebounce(
    () => {
      loadAllArtwork().then((result) => {
        setArtworkCache(result.trackCache);
        setArtistArtworkCache(result.artistCache);
      });
    },
    10000,
    [allTracks, artistsInfo]
  );

  useEffect(() => {
    loadAllArtwork().then((result) => {
      setArtworkCache(result.trackCache);
      setArtistArtworkCache(result.artistCache);
    });
  }, [activePlugins]);

  return (
    <ArtworkContext.Provider
      value={{ artworkCache, cacheArtwork, artistArtworkCache }}
    >
      {children}
    </ArtworkContext.Provider>
  );
};
