import { Allotment } from "allotment";
import React, { useRef } from "react";
import { SectionTree } from "../../src/section-tree/SectionTree";
import views from "../data/views.json";
import playlists from "../data/playlists.json";
import { TreeProps } from "react-arborist/dist/module/types/tree-props";
import {
  SectionTreeItem,
  Section,
  SectionTreeApi,
} from "../../src/section-tree/treeTypes";
import {
  createTreeNode,
  deleteTreeNode,
  moveTreeNode,
  updateTreeNode,
} from "../../src/section-tree/treeOperations";
import "allotment/dist/style.css";

export function ExampleEnvironment(
  props: TreeProps<SectionTreeItem> & {
    FolderOpenIcon: () => JSX.Element;
    FolderClosedIcon: () => JSX.Element;
    OptionsButtonIcon: () => JSX.Element;
    DoneButtonIcon: () => JSX.Element;
  }
) {
  const [sections, setSections] = React.useState([
    {
      id: "views",
      name: "Library",
      emptyMessage: "No views enabled",
      children: views as SectionTreeItem[],
    },
    {
      id: "playlists",
      name: "Playlists",
      emptyMessage: "No playlists",
      children: playlists as SectionTreeItem[],
    },
    {
      id: "empty",
      name: "Empty",
      emptyMessage: "Example empty section",
      children: [],
    },
  ]);

  const updateSection = (sectionId: string, newData: SectionTreeItem[]) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            children: newData,
          };
        }
        return section;
      }) as Section[]
    );
  };

  const createItem = (sectionId: string, isFolder?: boolean) => {
    const sectionIndex = sections.findIndex(
      (section) => section.id === sectionId
    );
    const newTree = createTreeNode(sections[sectionIndex].children, {
      newData: {
        id: "new-item-" + Math.random(),
        name: "New item",
        children: isFolder ? [] : undefined,
      },
    });
    updateSection(sectionId, newTree);
  };

  const ref = useRef<SectionTreeApi<SectionTreeItem>>(null);

  const [lastContextMenu, setLastContextMenu] = React.useState<{
    itemId: string;
    sectionId: string;
  } | null>(null);

  return (
    <div style={{ fontFamily: "Segoe UI", height: "500px" }}>
      <Allotment>
        <SectionTree
          {...props}
          ref={ref}
          sections={sections}
          initialOpenState={{
            b: true,
          }}
          onMoveWithinSection={(args) => {
            const sectionIndex = sections.findIndex(
              (section) => section.id === args.sectionId
            );
            const newTree = moveTreeNode(sections[sectionIndex].children, {
              id: args.movedItemId,
              parentId: args.newParentId,
              index: args.newIndex,
            });
            updateSection(args.sectionId, newTree);
          }}
          onRenameWithinSection={(sectionId, itemId, newName) => {
            const sectionIndex = sections.findIndex(
              (section) => section.id === sectionId
            );
            const newTree = updateTreeNode(sections[sectionIndex].children, {
              id: itemId,
              changes: { name: newName },
            });
            updateSection(sectionId, newTree);
          }}
          onItemVisibilityChange={(sectionId, itemId, hidden) => {
            const sectionIndex = sections.findIndex(
              (section) => section.id === sectionId
            );
            const newTree = updateTreeNode(sections[sectionIndex].children, {
              id: itemId,
              changes: { hidden },
            });
            updateSection(sections[sectionIndex].id, newTree);
          }}
          onOptionsMenuActiveChange={(sectionId, button) => {
            console.log("Options menu state changed to ", sectionId);
            console.log("Button position: ", button?.getBoundingClientRect());
          }}
          onVisibilityEditingChange={(sectionId) => {
            console.log("Visibility editing state changed to ", sectionId);
          }}
          onSelectedItemChange={(sectionId, itemId) => {
            console.log("Selected item changed to ", sectionId, itemId);
          }}
          onItemContextMenu={(sectionId, itemId) => {
            console.log("Context menu opened for ", sectionId, itemId);
            setLastContextMenu({ sectionId, itemId });
          }}
          onSectionContextMenu={(sectionId, e) => {
            console.log("Section context menu opened for ", sectionId);
            e.preventDefault();
          }}
          onRowKeyDown={(e) => {
            if (e.key === " ") {
              e.stopPropagation();
            }
          }}
          onFolderAction={(sectionId, itemId, action) => {
            console.log("Folder open: ", sectionId, itemId, action);
          }}
          onEmptySpaceContextMenu={(e) => {
            e.preventDefault();
            console.log("Empty space context menu");
          }}
          optionsButtonTooltip="Options"
          doneButtonTooltip="Done"
        />
        <div>
          <button
            onClick={() => {
              ref?.current?.setSelectedItem(null);
            }}
          >
            Clear selection
          </button>
          <br /> <br />
          {sections.map((section) => (
            <React.Fragment key={section.id}>
              <button onClick={() => createItem(section.id)}>
                Add item to {section.name}
              </button>
              <button onClick={() => createItem(section.id, true)}>
                Add folder to {section.name}
              </button>
              <button
                onClick={() =>
                  ref?.current?.setOptionsMenuActive(
                    ref?.current?.optionsMenuActive == section.id
                      ? null
                      : section.id
                  )
                }
              >
                Toggle options menu for {section.name}
              </button>
              <button
                onClick={() =>
                  ref?.current?.setVisibilityEditing(
                    ref?.current?.visibilityEditing == section.id
                      ? null
                      : section.id
                  )
                }
              >
                Toggle visibility editing for {section.name}
              </button>
              <br /> <br />
            </React.Fragment>
          ))}
          <br /> <br />
          {lastContextMenu && (
            <div>
              Context menu for {lastContextMenu.itemId}:
              <button
                onClick={() => {
                  ref.current?.root.tree.edit(lastContextMenu.itemId);
                }}
              >
                Rename
              </button>
              <button
                onClick={() => {
                  const sectionIndex = sections.findIndex(
                    (section) => section.id === lastContextMenu.sectionId
                  );
                  const deletion = deleteTreeNode(
                    sections[sectionIndex].children,
                    { id: lastContextMenu.itemId }
                  );
                  updateSection(lastContextMenu.sectionId, deletion.result);
                  setLastContextMenu(null);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </Allotment>
    </div>
  );
}
