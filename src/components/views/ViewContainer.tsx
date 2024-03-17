import DebugView from "./DebugView";
import { useAppSelector } from "../../app/hooks";
import { DisplayMode, View } from "../../app/view";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";
import { SplitView } from "./SplitView";
import {
  selectVisibleDisplayMode,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import { Queue } from "./Queue";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleViewType = useAppSelector(selectVisibleViewType);

  return (
    <>
      {visibleViewType == View.Queue && <Queue />}
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
