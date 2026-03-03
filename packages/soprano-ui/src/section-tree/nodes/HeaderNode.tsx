import { NodeApi, NodeRendererProps } from "react-arborist";
import { SectionTreeItem } from "../treeTypes";
import treeStyles from "../SectionTree.module.css";
import styles from "./HeaderNode.module.css";

export function HeaderNode(
  props: NodeRendererProps<SectionTreeItem> & {
    OptionsButtonIcon: () => JSX.Element;
    DoneButtonIcon: () => JSX.Element;
    optionsButtonTooltip?: string;
    doneButtonTooltip?: string;
    optionsMenuActive: string | null;
    visibilityEditing: string | null;
    onNodeClick: (
      node: NodeApi<SectionTreeItem>,
      event: React.MouseEvent
    ) => void;
  }
) {
  const { node, style } = props;
  const sectionEditing = node.data.sectionId == props.visibilityEditing;
  return (
    <div style={style}>
      <div className={`${treeStyles.node} ${styles.header}`}>
        <div className={styles.headerText}>{node.data.name}</div>
        <div
          data-options-button={node.data.sectionId}
          className={`${styles.optionsButton} ${
            props.optionsMenuActive == node.data.sectionId
              ? styles.optionsButtonActive
              : ""
          }`}
          onClick={(e) => {
            props.onNodeClick(node, e);
          }}
          title={
            sectionEditing
              ? props.doneButtonTooltip
              : props.optionsButtonTooltip
          }
        >
          {sectionEditing ? (
            <props.DoneButtonIcon />
          ) : (
            <props.OptionsButtonIcon />
          )}
        </div>
      </div>
    </div>
  );
}
