"use client";

import { Delete } from "lucide-react";
import { Button } from "@heroui/react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"] as const;

export function AmountKeypad({
  onDigit,
  onBackspace,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <Button
          key={key}
          variant="secondary"
          className="h-12 text-lg font-medium"
          onPress={() => onDigit(key)}
        >
          {key}
        </Button>
      ))}
      <Button
        variant="secondary"
        isIconOnly
        aria-label="删除一位"
        className="h-12 w-full"
        onPress={onBackspace}
      >
        <Delete className="size-5" />
      </Button>
    </div>
  );
}
