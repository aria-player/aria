import DebugView from "./DebugView";
import { useAppSelector } from "../../app/hooks";
import { DisplayMode } from "../../app/view";
import { selectVisibleDisplayMode } from "../../features/sharedSelectors";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);

  return (
    <>
      <div
        style={{
          height: "100%",
          width: "100%",
          display:
            visibleDisplayMode == DisplayMode.TrackList ? "block" : "none"
        }}
      >
        <TrackList />
      </div>
      <div
        style={{
          height: "100%",
          width: "100%",
          display:
            visibleDisplayMode == DisplayMode.AlbumGrid ? "block" : "none"
        }}
      >
        <AlbumGrid />
      </div>
      {visibleDisplayMode == DisplayMode.DebugView && <DebugView />}
    </>
  );
}
