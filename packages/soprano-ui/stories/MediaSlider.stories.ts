import type { Meta, StoryObj } from "@storybook/react-vite";
import { MediaSlider } from "../src/media-slider/MediaSlider";

const meta = {
  title: "Example/MediaSlider",
  component: MediaSlider,
  tags: ["autodocs"],
  args: {
    min: 0,
    max: 180,
    step: 0.1,
    keyboardStepMultiplier: 150,
    keyboardFocusOnly: true,
    thumbAlignment: "center",
  },
} satisfies Meta<typeof MediaSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
};

export const RTL: Story = {
  args: {
    dir: "rtl",
  },
};

export const VerticalRTL = {
  args: {
    orientation: "vertical",
    dir: "rtl",
  },
};
