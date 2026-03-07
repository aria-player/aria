import { DragPreviewProps } from "react-arborist";
import { XYCoord } from "react-dnd";
import { SectionTreeItem } from "./treeTypes";
import { findTreeNode } from "./treeUtils";
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
  treeData,
}: DragPreviewProps & { treeData?: SectionTreeItem[] }) {
  const nodeName =
    treeData && id ? findTreeNode(treeData, id)?.name : undefined;
  if (!nodeName || !isDragging) return null;
  return (
    <div className={styles.preview}>
      <div className="row preview" style={getStyle(offset)}>
        <div className={styles.node}>{nodeName}</div>
      </div>
    </div>
  );
}
