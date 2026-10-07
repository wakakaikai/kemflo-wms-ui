/** 保持原页签顺序，并保证当前页签不会被收进“更多”。宽度包含页签间距。 */
export function fitTagIndexes(widths: number[], availableWidth: number, activeIndex: number): number[] {
  const selected: number[] = [];
  let usedWidth = 0;
  const budget = Math.max(0, availableWidth);
  for (let index = 0; index < widths.length; index++) {
    if (usedWidth + widths[index] > budget) break;
    selected.push(index);
    usedWidth += widths[index];
  }
  if (activeIndex >= 0 && activeIndex < widths.length && !selected.includes(activeIndex)) {
    while (selected.length && usedWidth + widths[activeIndex] > budget) {
      usedWidth -= widths[selected.pop()!];
    }
    selected.push(activeIndex);
  }
  return selected;
}
