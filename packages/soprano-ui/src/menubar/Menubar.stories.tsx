import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";
import type { MenubarMenu } from "../shared/menu-types";

const meta = {
  title: "Soprano/Menubar",
  component: Menubar,
  tags: ["autodocs"],
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const menus: MenubarMenu[] = [
  {
    label: "File",
    items: [
      { label: "Settings...", shortcut: "Ctrl+," },
      { type: "separator" },
      { label: "Exit", shortcut: "Ctrl+Shift+Q" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "Ctrl+Z" },
      { label: "Redo", shortcut: "Ctrl+Y" },
      { type: "separator" },
      { label: "Cut", shortcut: "Ctrl+X" },
      { label: "Copy", shortcut: "Ctrl+C" },
      { label: "Paste", shortcut: "Ctrl+V" },
      { label: "Delete", shortcut: "Del" },
      { type: "separator" },
      { label: "Select All", shortcut: "Ctrl+A" },
    ],
  },
  {
    label: "View",
    items: [
      {
        type: "submenu",
        label: "Columns",
        items: [
          {
            type: "checkbox",
            label: "Artwork",
            checked: true,
            onCheckedChange: () => {},
          },
          {
            type: "checkbox",
            label: "Title",
            checked: true,
            onCheckedChange: () => {},
          },
        ],
      },
      { type: "separator" },
      { label: "Toggle Fullscreen", shortcut: "F11" },
    ],
  },
  {
    label: "Playback",
    items: [
      { label: "Play", shortcut: "Space" },
      { label: "Next", shortcut: "Ctrl+→" },
      { label: "Previous", shortcut: "Ctrl+←" },
      { type: "separator" },
      { label: "Toggle Shuffle", shortcut: "Ctrl+S" },
      { label: "Toggle Repeat", shortcut: "Ctrl+R" },
      { type: "separator" },
      { label: "Volume Up", shortcut: "Ctrl+↑" },
      { label: "Volume Down", shortcut: "Ctrl+↓" },
      { label: "Mute", shortcut: "Ctrl+M" },
    ],
  },
  {
    label: "Navigate",
    items: [
      { label: "Back", shortcut: "Alt+←" },
      { label: "Forward", shortcut: "Alt+→" },
      { type: "separator" },
      { label: "Go to current track" },
    ],
  },
  {
    label: "Help",
    items: [{ label: "About..." }],
  },
];

export const Default: Story = {
  args: { menus },
};
