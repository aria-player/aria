import { DragPreviewProps, TreeApi } from "react-arborist";
import { XYCoord } from "react-dnd";
import { SectionTreeItem } from "./treeTypes";
import styles from "./DragPreview.module.css";

const getStyle = (offset: XYCoord | null) => {
  if (!offset) return { display: "none" };
  const { x, y } = offset;
  return { transform: `translate(${x}px, ${y}px)` };
};

export function DragPreview({
  offset,
  id,
  isDragging,
  treeRef,
}: DragPreviewProps & { treeRef: React.RefObject<TreeApi<SectionTreeItem>> }) {
  const node = treeRef.current?.get(id);
  if (!node || !isDragging) return null;
  return (
    <div className={styles.preview}>
      <div className="row preview" style={getStyle(offset)}>
        <div className={styles.node}>{node.data.name}</div>
      </div>
    </div>
  );
}
