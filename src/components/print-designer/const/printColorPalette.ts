/** 10 �� �� 7 �У��������ľ/Excel ����ɫ�� */
export const PRINT_COLOR_PALETTE_ROWS: readonly (readonly string[])[] = [
  ['#000000', '#44546a', '#4472c4', '#ed7d31', '#ffc000', '#70ad47', '#5b9bd5', '#264478', '#9e480e', '#636363'],
  ['#3b3838', '#8496b0', '#8eaadb', '#f4b183', '#ffd965', '#a8d08d', '#9dc3e6', '#2e5a8a', '#c55a11', '#757171'],
  ['#595959', '#adb9ca', '#b4c6e7', '#f8cbad', '#ffe699', '#c6e0b4', '#bdd7ee', '#4472c4', '#f4b084', '#a5a5a5'],
  ['#7f7f7f', '#d6dce4', '#d9e2f3', '#fce4d5', '#fff2cc', '#e2efda', '#deebf7', '#5b9bd5', '#f8cbad', '#bfbfbf'],
  ['#a5a5a5', '#e9ebf5', '#ecf0f8', '#fdf2e9', '#fff9e6', '#f1f8ec', '#eef6fc', '#8eaadb', '#fbe4d5', '#d9d9d9'],
  ['#bfbfbf', '#f2f2f2', '#f4f7fb', '#fef6f0', '#fffdf5', '#f8fcf6', '#f7fbfe', '#bdd7ee', '#fdeada', '#ededed'],
  ['#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#7030a0', '#ff00ff']
] as const;

export const PRINT_COLOR_GRID_COLS = 10;

export const PRINT_COLOR_SWATCHES: readonly string[] = PRINT_COLOR_PALETTE_ROWS.flat();

export const PRINT_COLOR_TRANSPARENT = 'transparent';
