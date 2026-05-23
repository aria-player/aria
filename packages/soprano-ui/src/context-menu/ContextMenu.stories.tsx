import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenuProvider } from "./ContextMenu";
import { useContextMenu } from "./contextMenuContext";
import type { MenuItem } from "../shared/menu-types";

const items: MenuItem[] = [
  { label: "Cut", shortcut: "⌘X" },
  { label: "Copy", shortcut: "⌘C" },
  { label: "Paste", shortcut: "⌘V" },
  { type: "separator" },
  {
    type: "submenu",
    label: "More",
    items: [{ label: "Select All", shortcut: "⌘A" }],
  },
];

function ContextMenuDemo() {
  const showContextMenu = useContextMenu();
  return (
    <div
      onContextMenu={(e) => showContextMenu(e, items)}
      style={{
        width: "12rem",
        height: "6rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px dashed var(--primary-border)",
        borderRadius: "0.375rem",
        color: "var(--secondary-text)",
        fontSize: "0.875rem",
        userSelect: "none",
      }}
    >
      Right-click here
    </div>
  );
}

const meta = {
  title: "Soprano/ContextMenu",
  component: ContextMenuDemo,
  decorators: [
    (Story) => (
      <ContextMenuProvider>
        <Story />
      </ContextMenuProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof ContextMenuDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
