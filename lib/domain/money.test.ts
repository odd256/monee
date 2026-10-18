import { describe, expect, it } from "vitest";
import {
  formatMoney,
  fromMinor,
  parseAmountInput,
  toMinor,
} from "@/lib/domain/money";

describe("money", () => {
  it("converts CNY amounts to integer minor units", () => {
    expect(toMinor(12.34)).toBe(1234);
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(fromMinor(1234)).toBe(12.34);
  });

  it("handles zero-decimal currencies", () => {
    expect(toMinor(1200, "JPY")).toBe(1200);
    expect(fromMinor(1200, "JPY")).toBe(1200);
  });

  it("parses keypad input with at most the currency precision", () => {
    expect(parseAmountInput("12.3456")).toBe(1234);
    expect(parseAmountInput("0.")).toBe(0);
    expect(parseAmountInput("")).toBe(0);
    expect(parseAmountInput("¥ 8.5")).toBe(850);
  });

  it("formats currency for display", () => {
    expect(formatMoney(1234, "CNY", "zh-CN")).toContain("12.34");
  });
});
