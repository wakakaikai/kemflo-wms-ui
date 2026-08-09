import { captureReadResultScreenshot } from '@/views/iot/utils/captureReadResult';
import { MSG } from '../messages';

function applyStatusTagStyles(tag: HTMLElement) {
  tag.style.display = 'inline-block';
  tag.style.opacity = '1';
  tag.style.padding = '0 9px';
  tag.style.height = '22px';
  tag.style.lineHeight = '20px';
  tag.style.fontSize = '12px';
  tag.style.borderRadius = '4px';
  tag.style.border = '1px solid';
  tag.style.whiteSpace = 'nowrap';
  tag.style.verticalAlign = 'middle';

  if (tag.classList.contains('is-pass')) {
    tag.style.color = '#fff';
    tag.style.backgroundColor = '#67c23a';
    tag.style.borderColor = '#67c23a';
  } else {
    tag.style.color = '#fff';
    tag.style.backgroundColor = '#f56c6c';
    tag.style.borderColor = '#f56c6c';
  }
}

function prepareTraceClone(clonedRoot: HTMLElement) {
  clonedRoot.querySelectorAll<HTMLElement>('.el-table__fixed, .el-table__fixed-right').forEach((el) => {
    el.style.display = 'none';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.el-table__inner-wrapper, .trace-table-wrap').forEach((el) => {
    el.style.width = '100%';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.el-table__header table, .el-table__body table').forEach((table) => {
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.el-table__header, .el-table__body').forEach((table) => {
    table.style.width = '100%';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.trace-status-tag').forEach(applyStatusTagStyles);
}

export async function captureTraceScreenshot(root: HTMLElement, sfc?: string) {
  const safeSfc = (sfc || 'trace').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  await captureReadResultScreenshot({
    root,
    fileName: `${MSG.captureFilePrefix}_${safeSfc}_${stamp}.png`,
    scale: 2,
    onclone: prepareTraceClone
  });
}
