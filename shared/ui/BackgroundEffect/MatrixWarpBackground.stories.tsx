import type { Meta, StoryObj } from '@storybook/react';
import { MatrixWarpBackground } from './MatrixWarpBackground';

const meta: Meta<typeof MatrixWarpBackground> = {
  title: 'Shared/UI/BackgroundEffect/MatrixWarpBackground',
  component: MatrixWarpBackground,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    speed: { control: { type: 'range', min: 0.1, max: 20, step: 0.1 } },
    density: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
    chars: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof MatrixWarpBackground>;

export const Default: Story = {
  args: {
    speed: 2,
    density: 300,
    chars: '0123456789ABCDEF',
  },
};

export const FastAndDense: Story = {
  args: {
    speed: 10,
    density: 800,
  },
};

export const Binary: Story = {
  args: {
    chars: '01',
    density: 500,
  },
};

export const ScrollTest: Story = {
  render: (args) => (
    <div style={{ height: '200vh', position: 'relative' }}>
        <MatrixWarpBackground {...args} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '2rem', textAlign: 'center' }}>
            <h1>Scroll Down</h1>
            <p>To see the vanishing point shift</p>
        </div>
        <div style={{ position: 'absolute', top: '150%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '2rem' }}>
            Bottom
        </div>
    </div>
  ),
};
