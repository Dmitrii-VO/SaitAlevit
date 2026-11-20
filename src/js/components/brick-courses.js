// Row numbers are document coordinates. Only the visible rows have DOM elements.
export const COURSE_HEIGHT = 18;
export const NOMINAL_WIDTH = 44;

export function rowGeometry(width, row) {
  const columns = Math.max(1, Math.round(width / NOMINAL_WIDTH));
  const brick = width / columns;
  const reverse = row % 2 === 1;
  return { brick, count: columns + Number(reverse), reverse };
}

export function brickAt(width, row, index) {
  const { brick, count, reverse } = rowGeometry(width, row);
  const column = reverse ? count - 1 - index : index;
  const offset = reverse ? brick / 2 : 0;
  const left = Math.max(0, column * brick - offset);
  const right = Math.min(width, (column + 1) * brick - offset);
  return { left, width: right - left };
}

// Start near the reader. Once their screen is filled, continue through the document.
export function nextCourse(progress, rowCount, bottomVisible) {
  const start = Math.max(0, Math.min(rowCount - 1, bottomVisible));
  for (let row = start; row >= 0; row--) {
    if ((progress.get(row) || 0) < 1) return row;
  }
  for (let row = start + 1; row < rowCount; row++) {
    if ((progress.get(row) || 0) < 1) return row;
  }
  return -1;
}
