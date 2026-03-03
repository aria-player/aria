import { NodeApi } from "react-arborist";
import { SectionTreeItem } from "./treeTypes";

export function findTreeNode(
  data: SectionTreeItem[],
  id: string
): SectionTreeItem | undefined {
  for (const item of data) {
    if (item.id === id) return item;
    const found = item.children && findTreeNode(item.children, id);
    if (found) return found;
  }
}

export function findParentTreeNode(
  data: SectionTreeItem[],
  childId: string
): SectionTreeItem | null {
  for (const item of data) {
    if (item.children?.some((child) => child.id === childId)) {
      return item;
    }
    const foundParent =
      item.children && findParentTreeNode(item.children, childId);
    if (foundParent) return foundParent;
  }
  return null;
}

export const findTopLevelNode = (
  node: NodeApi<SectionTreeItem>
): NodeApi<SectionTreeItem> => {
  if (node.level === 0) {
    return node;
  }

  let currentNode = node;
  while (currentNode.parent && currentNode.level > 0) {
    currentNode = currentNode.parent;
  }

  return currentNode;
};

export const findSectionFromNode = (node: NodeApi<SectionTreeItem>): string =>
  findTopLevelNode(node).data.sectionId!;

export const findTopLevelIndex = (
  node: NodeApi,
  relativeIndex?: number
): number => {
  if (node.level === -1) {
    return relativeIndex ?? node.childIndex;
  }

  let currentNode = node;
  while (currentNode.parent && currentNode.level > 0) {
    currentNode = currentNode.parent;
  }

  return currentNode.childIndex;
};

export const findSection = (
  sectionHeaderIndices: number[],
  index: number
): number => {
  for (let i = 0; i < sectionHeaderIndices.length; i++) {
    if (index <= sectionHeaderIndices[i]) {
      return i;
    }
  }
  return sectionHeaderIndices.length;
};

export const shouldDisableDrop = (
  sourceNode: NodeApi<SectionTreeItem>,
  destinationParentNode: NodeApi<SectionTreeItem>,
  destinationRelativeIndex: number
): boolean => {
  if (!sourceNode) return true;

  const sectionHeaderIndices = sourceNode.tree.props.data
    ?.map((node, i) => (node.type === "header" ? i : -1))
    .filter((index) => index !== -1);

  const sourceTopLevelIndex = findTopLevelIndex(
    sourceNode.parent!,
    sourceNode.childIndex
  );
  const destinationTopLevelIndex = findTopLevelIndex(
    destinationParentNode,
    destinationRelativeIndex
  );

  const sourceSection = findSection(sectionHeaderIndices!, sourceTopLevelIndex);
  const destinationSection = findSection(
    sectionHeaderIndices!,
    destinationTopLevelIndex
  );

  if (
    destinationSection != sourceSection ||
    destinationTopLevelIndex == sectionHeaderIndices![destinationSection]
  ) {
    return true;
  }

  return false;
};
