import { CursorProps } from "react-arborist";
import styles from "./DropCursor.module.css";

export function DropCursor({ top, left }: CursorProps) {
  return <div className={styles.dropCursor} style={{ top, left }}></div>;
}
