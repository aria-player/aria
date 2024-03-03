import DebugView from "./DebugView";
import { useAppSelector } from "../../app/hooks";
import { DisplayMode } from "../../app/view";
import { selectVisibleDisplayMode } from "../../features/sharedSelectors";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";
import { SplitView } from "./SplitView";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);

  return (
    <>
      {visibleDisplayMode == DisplayMode.TrackList && (
        <div style={{ height: "100%", width: "100%" }}>
          <TrackList />
        </div>
      )}
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
      {visibleDisplayMode == DisplayMode.SplitView && <SplitView />}
      {visibleDisplayMode == DisplayMode.DebugView && <DebugView />}
    </>
  );
}
