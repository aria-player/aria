import { NodeApi, NodeRendererProps } from "react-arborist";
import { SectionTreeItem } from "../treeTypes";
import treeStyles from "../SectionTree.module.css";
import styles from "./ItemNode.module.css";
import { findSectionFromNode } from "../treeUtils";
import { useRef, useEffect } from "react";

export function ItemNode(
  props: NodeRendererProps<SectionTreeItem> & {
    FolderOpenIcon: () => JSX.Element;
    FolderClosedIcon: () => JSX.Element;
    onItemVisibilityChange?: (
      sectionId: string,
      itemId: string,
      hidden: boolean
    ) => void;
    onItemContextMenu?: (
      sectionId: string,
      itemId: string,
      event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => void;
    onNodeClick: (
      node: NodeApi<SectionTreeItem>,
      event: React.MouseEvent
    ) => void;
    visibilityEditing: string | null;
    onRenameWithinSection?: (
      sectionId: string,
      itemId: string,
      newName: string
    ) => void;
  }
) {
  const { node, style, dragHandle } = props;
  const showCheckbox =
    node.level == 0 && props.visibilityEditing == findSectionFromNode(node);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && node.isEditing) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current) {
        if (!inputRef.current.contains(event.target as Node)) {
          props.onRenameWithinSection?.(
            findSectionFromNode(node),
            node.id,
            inputRef.current!.value
          );
          node.reset();
        } else {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handleClickOutside, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [props, node]);

  return (
    <div
      style={style}
      ref={dragHandle}
      onClick={(e) => {
        props.onNodeClick(node, e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onItemContextMenu?.(findSectionFromNode(node), node.id, e);
      }}
      onDragStart={(e) => {
        if (node.isEditing) {
          e.preventDefault();
        }
      }}
    >
      <div
        className={`${treeStyles.node} ${styles.item} 
        ${node.tree.selectedNodes[0]?.id == node.id ? styles.selected : ""}
        ${node.isEditing ? styles.editing : styles.itemText}`}
      >
        {node.isEditing ? (
          <input
            className={styles.input}
            type="text"
            defaultValue={node.data.name}
            ref={inputRef}
            onContextMenu={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                props.onRenameWithinSection?.(
                  findSectionFromNode(node),
                  node.id,
                  inputRef.current!.value
                );
                node.reset();
                e.stopPropagation();
                node.focus();
              }
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onDragStart={(e) => {
              e.stopPropagation();
            }}
          />
        ) : (
          <>
            {!node.isLeaf && (
              <div className={styles.folderIcon}>
                {node.isOpen ? (
                  <props.FolderOpenIcon />
                ) : (
                  <props.FolderClosedIcon />
                )}
              </div>
            )}
            {showCheckbox && (
              <input type="checkbox" checked={!node.data.hidden} readOnly />
            )}
            <span className={styles.itemText}>{node.data.name}</span>
          </>
        )}
      </div>
    </div>
  );
}
