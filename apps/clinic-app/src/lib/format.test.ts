import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { addDays, buildDateStripItems, formatDateLabel, formatTimeLabel, todayDateString } from "./format";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

describe("format", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-10T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("todayDateString returns the frozen current date", () => {
    expect(todayDateString()).toBe("2026-03-10");
  });

  it("addDays advances the date string, including across a month boundary", () => {
    expect(addDays("2026-03-10", 5)).toBe("2026-03-15");
    expect(addDays("2026-03-10", 25)).toBe("2026-04-04");
  });

  it('formatDateLabel returns "Today" for the current date', () => {
    expect(formatDateLabel(todayDateString())).toBe("Today");
  });

  it('formatDateLabel returns "Tomorrow" for the next date', () => {
    expect(formatDateLabel(addDays(todayDateString(), 1))).toBe("Tomorrow");
  });

  it("formatDateLabel returns a weekday + day + month label for any other date", () => {
    const future = addDays(todayDateString(), 10);
    const expectedDate = new Date(`${future}T00:00:00`);
    const expected = `${WEEKDAY_SHORT[expectedDate.getDay()]}, ${expectedDate.getDate()} ${MONTH_SHORT[expectedDate.getMonth()]}`;
    expect(formatDateLabel(future)).toBe(expected);
  });

  it("formatTimeLabel formats midnight, morning, noon, and evening correctly", () => {
    expect(formatTimeLabel("00:00")).toBe("12:00 AM");
    expect(formatTimeLabel("09:05")).toBe("9:05 AM");
    expect(formatTimeLabel("12:00")).toBe("12:00 PM");
    expect(formatTimeLabel("23:45")).toBe("11:45 PM");
  });

  it("buildDateStripItems labels the first two entries Today/Tmrw and the rest blank", () => {
    const items = buildDateStripItems(todayDateString(), 5);
    expect(items).toHaveLength(5);
    expect(items[0]?.label).toBe("Today");
    expect(items[1]?.label).toBe("Tmrw");
    expect(items[2]?.label).toBe("");
  });
});
