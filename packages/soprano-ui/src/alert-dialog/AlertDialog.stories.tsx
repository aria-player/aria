import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { AlertDialog } from "./AlertDialog";

const meta = {
  title: "AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Delete</button>
        <AlertDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Are you sure?",
    description: "Deleting this folder will also delete all of its contents.",
    cancelLabel: "Cancel",
    confirmLabel: "Delete",
  },
};
