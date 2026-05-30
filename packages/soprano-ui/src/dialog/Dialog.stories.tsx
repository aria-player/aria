import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Dialog } from "./Dialog";

const meta = {
  title: "Dialog",
  component: Dialog,
  tags: ["autodocs"],
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        <Dialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Success",
    description: "Operation completed successfully.",
    actions: [{ label: "Close", variant: "primary" }],
  },
};

export const WithContent: Story = {
  args: {
    title: "Edit Track",
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label>
          Title
          <input
            style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
          />
        </label>
        <label>
          Artist
          <input
            style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
          />
        </label>
      </div>
    ),
    actions: [
      { label: "Cancel", variant: "secondary" },
      { label: "Save", variant: "primary" },
    ],
  },
};
