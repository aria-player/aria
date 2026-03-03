import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionTree } from "../src/section-tree/SectionTree";
import { ExampleEnvironment } from "./example/ExampleEnvironment";

const meta = {
  title: "Example/SectionTree",
  component: SectionTree,
  tags: ["autodocs"],
  args: {
    FolderOpenIcon: () => <div>V</div>,
    FolderClosedIcon: () => <div>&gt;</div>,
    OptionsButtonIcon: () => <div>*</div>,
    DoneButtonIcon: () => <div>!</div>,
  },
} satisfies Meta<typeof SectionTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => ExampleEnvironment(args),
};
