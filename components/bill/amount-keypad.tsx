"use client";

import { Delete } from "lucide-react";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"] as const;

export function AmountKeypad({
  onDigit,
  onBackspace,
  className,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-1 [@media(max-height:700px)]:gap-0.5", className)}>
      {KEYS.map((key) => (
        <Button
          key={key}
          variant="secondary"
          className="h-11 w-full rounded-xl text-lg font-medium [@media(max-height:700px)]:h-10 md:h-10"
          aria-label={key === "." ? "小数点" : key}
          onPress={() => onDigit(key)}
        >
          {key}
        </Button>
      ))}
      <Button
        variant="secondary"
        isIconOnly
        aria-label="退格"
        className="h-11 w-full rounded-xl [@media(max-height:700px)]:h-10 md:h-10"
        onPress={onBackspace}
      >
        <Delete className="size-5" />
      </Button>
    </div>
  );
}
