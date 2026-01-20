import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import { HackingConsoleView } from "./HackingConsoleView";

const meta: Meta<typeof HackingConsoleView> = {
  title: "Widgets/HackingConsole",
  component: HackingConsoleView,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof HackingConsoleView>;

const demoAnswer = "n8x1k2p9";

export const Default: Story = {
  args: {
    length: 8,
    charset: ["lowercase", "alphanumeric"],
    disabled: false,
    isValidLength: false,
    value: "",
    error: null,
    isShaking: false,
    showErrorBorder: false,
    lastAttempt: null,
    lastAttemptIsCorrect: null,
    cpCurrent: 35,
    cpMax: 50,
    onChange: () => {},
    onKeyDown: () => {},
    onSubmit: () => {},
  },
};

export const Interactive: Story = {
  args: {
    ...Default.args,
    cpCurrent: 8,
  },
  render: (args) => {
    const [value, setValue] = useState("");
    const [lastAttempt, setLastAttempt] = useState<{ input: string; similarity: number } | null>(null);
    const [lastAttemptIsCorrect, setLastAttemptIsCorrect] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const [showErrorBorder, setShowErrorBorder] = useState(false);
    const [cpCurrent, setCpCurrent] = useState(args.cpCurrent ?? 8);
    const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isValidLength = value.length === args.length;
    const disabled = cpCurrent <= 0;

    const resetShake = () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }
    };

    const triggerShake = () => {
      resetShake();
      setIsShaking(true);
      setShowErrorBorder(true);
      shakeTimeoutRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 500);
    };

    const calculateSimilarity = (input: string, answer: string) => {
      if (input.length === 0 || answer.length === 0) {
        return 0;
      }

      const maxLength = Math.max(input.length, answer.length);
      let matches = 0;

      for (let i = 0; i < maxLength; i += 1) {
        if (input[i] && answer[i] && input[i] === answer[i]) {
          matches += 1;
        }
      }

      return Math.round((matches / maxLength) * 100);
    };

    const handleSubmit = () => {
      if (disabled) {
        setError("CP가 부족합니다.");
        triggerShake();
        return;
      }

      if (!isValidLength) {
        setError(`정확히 ${args.length}자 입력해야 합니다.`);
        triggerShake();
        return;
      }

      setError(null);
      setShowErrorBorder(false);
      setCpCurrent((prev) => Math.max(prev - 1, 0));

      const similarity = calculateSimilarity(value, demoAnswer);
      const isCorrect = value === demoAnswer;
      setLastAttempt({ input: value, similarity });
      setLastAttemptIsCorrect(isCorrect);

      if (!isCorrect) {
        triggerShake();
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      setError(null);
      setShowErrorBorder(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSubmit();
      }
    };

    return (
      <HackingConsoleView
        {...args}
        value={value}
        isValidLength={isValidLength}
        disabled={disabled}
        error={error}
        isShaking={isShaking}
        showErrorBorder={showErrorBorder}
        lastAttempt={lastAttempt}
        lastAttemptIsCorrect={lastAttemptIsCorrect}
        cpCurrent={cpCurrent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
      />
    );
  },
};

export const WrongAnswer: Story = {
  args: {
    ...Default.args,
    value: "abc123xy",
    isValidLength: true,
    isShaking: true,
    showErrorBorder: true,
    lastAttempt: { input: "abc123xy", similarity: 67 },
    lastAttemptIsCorrect: false,
  },
};

export const LowCP: Story = {
  args: {
    ...Default.args,
    cpCurrent: 0,
    disabled: true,
  },
};
