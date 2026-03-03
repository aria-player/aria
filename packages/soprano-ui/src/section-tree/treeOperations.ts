import { SectionTreeItem } from "./treeTypes";
import { findParentTreeNode, findTreeNode } from "./treeUtils";

export function createTreeNode(
  data: SectionTreeItem[],
  args: { newData: SectionTreeItem; parentId?: string; index?: number }
): SectionTreeItem[] {
  if (!args.parentId) {
    data.splice(args.index ?? data.length, 0, args.newData);
    return data;
  }

  const parent = findTreeNode(data, args.parentId);
  if (parent) {
    parent.children = parent.children || [];
    parent.children.splice(
      args.index ?? parent.children.length,
      0,
      args.newData
    );
  }

  return data;
}

export function moveTreeNode(
  data: SectionTreeItem[],
  args: { id: string; parentId: string | null; index: number }
): SectionTreeItem[] {
  const nodeToRemove = findTreeNode(data, args.id);
  if (!nodeToRemove) return data;

  let offset = 0;
  const originalParent = findParentTreeNode(data, args.id);
  if (originalParent == null || originalParent.id === args.parentId) {
    let originalIndex = 0;
    if (originalParent) {
      originalIndex =
        originalParent.children?.findIndex((item) => item.id === args.id) ?? 0;
    } else {
      originalIndex = data?.findIndex((item) => item.id === args.id);
    }

    // If this node was originally behind its new index, offset the index by 1
    const originalParentId = originalParent?.id ?? null;
    if (originalIndex < args.index && originalParentId === args.parentId) {
      offset = -1;
    }
  }

  return createTreeNode(deleteTreeNode(data, { id: args.id }).result, {
    parentId: args.parentId ?? undefined,
    index: args.index + offset,
    newData: nodeToRemove,
  });
}

export function deleteTreeNode(
  data: SectionTreeItem[],
  args: { id: string }
): { result: SectionTreeItem[]; deletedIds: string[] } {
  let deletedIds: string[] = [];

  const result = data.reduce<SectionTreeItem[]>((acc, item) => {
    if (item.id === args.id) {
      deletedIds.push(item.id);
      const addChildIdsToDeleted = (item: SectionTreeItem) => {
        if (item.children) {
          item.children.forEach((child) => {
            deletedIds.push(child.id);
            addChildIdsToDeleted(child);
          });
        }
      };
      addChildIdsToDeleted(item);
      return acc;
    }

    if (item.children) {
      const innerDelete = deleteTreeNode(item.children, args);
      item.children = innerDelete.result;
      deletedIds = deletedIds.concat(innerDelete.deletedIds);
    }

    acc.push(item);
    return acc;
  }, []);

  return { result, deletedIds };
}

export function updateTreeNode(
  data: SectionTreeItem[],
  args: { id: string; changes: Partial<SectionTreeItem> }
): SectionTreeItem[] {
  return data.map((item) => {
    if (item.id === args.id) {
      return { ...item, ...args.changes };
    }
    if (item.children) {
      item.children = updateTreeNode(item.children, args);
    }
    return item;
  });
}
