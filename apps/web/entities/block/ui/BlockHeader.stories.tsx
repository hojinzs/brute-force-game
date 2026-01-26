import type { Meta, StoryObj } from "@storybook/react";
import { BlockHeader } from "./BlockHeader";

const meta: Meta<typeof BlockHeader> = {
  title: "Entities/Block/BlockHeader",
  component: BlockHeader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BlockHeader>;

export const Active: Story = {
  args: {
    blockId: 41,
    status: "active",
    accumulatedPoints: 2341,
    seedHint: "Password Is Password",
    creatorNickname: "Steve Lee",
  },
};

export const HighStakes: Story = {
  args: {
    blockId: 99,
    status: "active",
    accumulatedPoints: 150000,
    seedHint: "Complexity is key",
    creatorNickname: "CryptoMaster",
  },
};

export const NoHint: Story = {
  args: {
    blockId: 10,
    status: "pending",
    accumulatedPoints: 500,
    seedHint: null,
    creatorNickname: "Newbie",
  },
};
