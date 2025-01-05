import { createContext, useState, ReactNode, useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/tracks/tracksSlice";
import {
  getSourceHandle,
  selectActivePlugins
} from "../features/plugins/pluginsSlice";
import { Track } from "../features/tracks/tracksTypes";
import { useDebounce } from "react-use";
import { store } from "../app/store";

export const ArtworkContext = createContext<{
  artworkCache: Record<string, string>;
}>({
  artworkCache: {}
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
  const cache: Record<string, string> = {};
  for (const track of filterByUniqueArtwork(
    selectAllTracks(store.getState())
  )) {
    if (track.artworkUri) {
      const artwork = await (getSourceHandle(track.source)?.getTrackArtwork?.(
        track
      ) ?? Promise.resolve());
      if (artwork) cache[track.artworkUri] = artwork;
    }
  }
  return cache;
};

export const ArtworkProvider = ({ children }: { children: ReactNode }) => {
  const [artworkCache, setArtworkCache] = useState<Record<string, string>>({});
  const allTracks = useAppSelector(selectAllTracks);
  const activePlugins = useAppSelector(selectActivePlugins);

  useDebounce(
    () => {
      loadAllArtwork().then((result) => {
        setArtworkCache(result);
      });
    },
    10000,
    [allTracks]
  );

  useEffect(() => {
    loadAllArtwork().then((result) => {
      setArtworkCache(result);
    });
  }, [activePlugins]);

  return (
    <ArtworkContext.Provider value={{ artworkCache }}>
      {children}
    </ArtworkContext.Provider>
  );
};
