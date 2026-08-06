import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';

type StyleSnapshot = {
  el: HTMLElement;
  styles: Record<string, string>;
};

const STYLE_KEYS = ['maxHeight', 'height', 'overflow', 'overflowX', 'overflowY'] as const;

function snapshotAndExpand(el: HTMLElement): StyleSnapshot {
  const styles: Record<string, string> = {};
  STYLE_KEYS.forEach((key) => {
    styles[key] = el.style[key];
  });
  el.style.maxHeight = 'none';
  el.style.height = 'auto';
  el.style.overflow = 'visible';
  el.style.overflowX = 'visible';
  el.style.overflowY = 'visible';
  return { el, styles };
}

function restoreStyles(snapshots: StyleSnapshot[]) {
  snapshots.forEach(({ el, styles }) => {
    STYLE_KEYS.forEach((key) => {
      el.style[key] = styles[key] || '';
    });
  });
}

function waitFrames(times = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(times);
  });
}

/**
 * 对采集结果弹框做长截图：临时展开滚动区域，避免只截到可视区域。
 */
export async function captureReadResultScreenshot(options: {
  root: HTMLElement;
  fileName?: string;
  scale?: number;
}): Promise<void> {
  const { root, fileName = `采集结果_${Date.now()}.png`, scale = 2 } = options;
  const snapshots: StyleSnapshot[] = [];
  const dialog = (root.closest('.el-dialog') as HTMLElement) || root;

  dialog.classList.add('is-capturing');

  const targets = [
    dialog,
    root,
    ...Array.from(
      root.querySelectorAll<HTMLElement>(
        '.el-dialog__body, .el-table, .el-table__inner-wrapper, .el-table__body-wrapper, .el-table__header-wrapper, .el-scrollbar, .el-scrollbar__wrap, .el-scrollbar__view'
      )
    )
  ];

  Array.from(new Set(targets)).forEach((el) => snapshots.push(snapshotAndExpand(el)));
  await waitFrames(2);

  try {
    const canvas = await html2canvas(root, {
      scale,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: Math.max(root.scrollWidth, root.clientWidth),
      windowHeight: Math.max(root.scrollHeight, root.clientHeight)
    });

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('截图生成失败'));
          return;
        }
        FileSaver.saveAs(blob, fileName);
        resolve();
      }, 'image/png');
    });
  } finally {
    restoreStyles(snapshots);
    dialog.classList.remove('is-capturing');
  }
}

export function buildReadResultFileName(title?: string) {
  const safeTitle = (title || '采集结果').replace(/[\\/:*?"<>|]/g, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${safeTitle}_${stamp}.png`;
}
