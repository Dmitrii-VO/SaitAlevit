import { brickAt, nextCourse, rowGeometry } from "../src/js/components/brick-courses";

test.each([320, 769, 1024, 1279, 1920])("staggered courses cover all %i pixels", width => {
  for (const row of [0, 1]) {
    const { count, reverse } = rowGeometry(width, row);
    const slots = Array.from({ length: count }, (_, index) => brickAt(width, row, index));
    if (reverse) slots.reverse();
    let x = 0;
    for (const slot of slots) {
      expect(slot.left).toBeCloseTo(x);
      expect(slot.width).toBeGreaterThan(0);
      x += slot.width;
    }
    expect(x).toBeCloseTo(width);
  }
});

test("fills the visible area first and eventually every document row", () => {
  const progress = new Map();
  for (const expected of [2, 1, 0, 3, 4]) {
    const row = nextCourse(progress, 5, 2);
    expect(row).toBe(expected);
    progress.set(row, 1);
  }
  expect(nextCourse(progress, 5, 2)).toBe(-1);
  expect(nextCourse(progress, 7, 6)).toBe(6);
});
