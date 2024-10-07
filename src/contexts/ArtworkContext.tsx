import { createContext, useState, ReactNode } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/tracks/tracksSlice";
import { getSourceHandle } from "../features/plugins/pluginsSlice";
import { Track } from "../features/tracks/tracksTypes";
import { useDebounce } from "react-use";

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

export const ArtworkProvider = ({ children }: { children: ReactNode }) => {
  const [artworkCache, setArtworkCache] = useState<Record<string, string>>({});
  const allTracks = useAppSelector(selectAllTracks);

  useDebounce(
    () => {
      const loadAllArtwork = async () => {
        const store: Record<string, string> = {};
        for (const track of filterByUniqueArtwork(allTracks)) {
          if (track.artworkUri) {
            const artwork = await (getSourceHandle(
              track.source
            )?.getTrackArtwork?.(track) ?? Promise.resolve());
            if (artwork) store[track.artworkUri] = artwork;
          }
        }
        setArtworkCache(store);
      };
      loadAllArtwork();
    },
    10000,
    [allTracks]
  );

  return (
    <ArtworkContext.Provider value={{ artworkCache }}>
      {children}
    </ArtworkContext.Provider>
  );
};
