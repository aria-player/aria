import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownMenu } from "./DropdownMenu";
import type { MenuItem } from "../shared/menu-types";

const meta = {
  title: "Soprano/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Default: Story = {
  args: {
    trigger: <button>Options ▾</button>,
    items,
  },
};
