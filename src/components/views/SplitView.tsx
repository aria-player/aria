import { Allotment } from "allotment";
import { useAppSelector } from "../../app/hooks";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { selectVisibleTrackGroups } from "../../features/sharedSelectors";
import styles from "./SplitView.module.css";
import { useState } from "react";

export function SplitView() {
  const visibleItems = useAppSelector(selectVisibleTrackGroups);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const buttons = visibleItems.map((itemName, index) => (
    <li
      key={itemName}
      className={`${styles.listItem} ${selectedItem == itemName ? styles.selected : ""}`}
    >
      <button
        key={index}
        onClick={() => {
          setSelectedItem(itemName ?? null);
        }}
      >
        {itemName}
      </button>
    </li>
  ));

  return (
    <div className={styles.splitView}>
      <Allotment proportionalLayout={false}>
        <Allotment.Pane minSize={60}>
          <ul className={styles.trackGroupsList}>{buttons}</ul>
        </Allotment.Pane>
        <Allotment.Pane minSize={600}>
          <div className={styles.albumTrackList}>
            <AlbumTrackList />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
