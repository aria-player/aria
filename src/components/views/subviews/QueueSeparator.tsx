import { ICellRendererParams } from "@ag-grid-community/core";
import { useAppSelector } from "../../../app/hooks";
import { selectQueueSource } from "../../../features/player/playerSlice";
import styles from "./QueueSeparator.module.css";

export default function QueueSeparator(props: ICellRendererParams) {
  const queueSource = useAppSelector(selectQueueSource);

  return props.node.rowIndex == 0 ? (
    <div className={styles.separator}>Current track</div>
  ) : (
    <div className={styles.separator}>Playing from: {queueSource}</div>
  );
}
