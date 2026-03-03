import { NodeApi, RowRendererProps } from "react-arborist";
import { SectionTreeItem } from "./treeTypes";
import { findSectionFromNode } from "./treeUtils";

function isSeparatorOrEmpty(node: NodeApi<SectionTreeItem>) {
  return node.data.type && ["separator", "empty"].includes(node.data.type);
}

function getFocusableNode(
  currentNode: NodeApi<SectionTreeItem> | null,
  next: boolean
): NodeApi<SectionTreeItem> | null {
  if (!currentNode) return null;
  const nextNode = next ? currentNode.next : currentNode.prev;
  if (!nextNode || !isSeparatorOrEmpty(nextNode)) {
    return null;
  }
  const nodeAfterNext = next ? nextNode.next : nextNode.prev;
  if (!nodeAfterNext) {
    // Prevent focus of the last row if it's empty
    return next ? currentNode.prev : currentNode.next;
  }
  if (nodeAfterNext && isSeparatorOrEmpty(nodeAfterNext)) {
    // Skip focusing 2 rows
    return nodeAfterNext;
  }
  // Skip focusing 1 row
  return nextNode;
}

export function Row({
  node,
  attrs,
  innerRef,
  children,
  onNodeClick,
  onSectionContextMenu,
  onRowKeyDown,
}: RowRendererProps<SectionTreeItem> & {
  onNodeClick: (
    node: NodeApi<SectionTreeItem>,
    event: React.MouseEvent
  ) => void;
  onSectionContextMenu?: (section: string, e: React.MouseEvent) => void;
  onRowKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const section = findSectionFromNode(node);
  const adjustedAttrs = { ...attrs };
  if (node.data.type === "separator") {
    adjustedAttrs.role = "separator";
    delete adjustedAttrs.tabIndex;
    delete adjustedAttrs["aria-selected"];
  }

  return (
    <>
      <div
        {...adjustedAttrs}
        ref={innerRef}
        onFocus={(e) => {
          e.stopPropagation();
          if (node.tree.focusedNode == node && isSeparatorOrEmpty(node)) {
            node.tree.focus(node.prev);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            node.tree.focus(getFocusableNode(node.tree.focusedNode, false));
          } else if (e.key === "ArrowDown") {
            node.tree.focus(getFocusableNode(node.tree.focusedNode, true));
          } else if (e.key === "Enter") {
            onNodeClick(node, e as unknown as React.MouseEvent);
          }
          onRowKeyDown?.(e);
        }}
        onContextMenu={(e) => {
          onSectionContextMenu?.(section, e);
        }}
        data-section={section}
        data-item={node.data.id}
        data-folder={!node.isLeaf ? "true" : "false"}
      >
        {children}
      </div>
    </>
  );
}
