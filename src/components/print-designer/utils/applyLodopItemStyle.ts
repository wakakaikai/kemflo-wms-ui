import { is2dBarcodeType } from '../const/lodopBarcodeTypes';
import type { PrintTemplateItem } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LodopInstance = any;

/** Apply Lodop SET_PRINT_STYLEA for item position / scale (after ADD_PRINT_*). */
export function applyLodopPositionStyle(LODOP: LodopInstance, item: PrintTemplateItem) {
  const s = item.style || {};
  if (s.ItemType != null && s.ItemType !== undefined) {
    LODOP.SET_PRINT_STYLEA(0, 'ItemType', s.ItemType);
  }
  if (s.HOrient != null) {
    LODOP.SET_PRINT_STYLEA(0, 'HOrient', s.HOrient);
  }
  if (s.VOrient != null) {
    LODOP.SET_PRINT_STYLEA(0, 'VOrient', s.VOrient);
  }
  if (s.ScalX != null && s.ScalX > 0) {
    LODOP.SET_PRINT_STYLEA(0, 'ScalX', s.ScalX);
  }
  if (s.ScalY != null && s.ScalY > 0) {
    LODOP.SET_PRINT_STYLEA(0, 'ScalY', s.ScalY);
  }
  const linked = s.LinkedItem?.trim();
  if (linked) {
    LODOP.SET_PRINT_STYLEA(0, 'LinkedItem', linked);
  }
  const extra = item.lodopStyle;
  if (extra && typeof extra === 'object') {
    for (const [key, val] of Object.entries(extra)) {
      if (val !== undefined && val !== null && val !== '') {
        LODOP.SET_PRINT_STYLEA(0, key, val);
      }
    }
  }
}

/** Barcode / QR extended properties (after ADD_PRINT_BARCODE). */
export function applyLodopBarcodeStyle(LODOP: LodopInstance, item: PrintTemplateItem, codeType: string) {
  const s = item.style || {};
  const is2d = is2dBarcodeType(codeType);

  if (!s.BarcodeBgTransparent && s.BarcodeBgColor) {
    LODOP.SET_PRINT_STYLEA(0, 'GroundColor', s.BarcodeBgColor);
  }

  if (s.DataCharset) {
    LODOP.SET_PRINT_STYLEA(0, 'DataCharset', s.DataCharset);
  }

  if (is2d) {
    const ver = s.QRCodeVersion;
    if (typeof ver === 'number' && ver > 0) {
      LODOP.SET_PRINT_STYLEA(0, 'QRCodeVersion', ver);
    }
    if (s.QRCodeErrorLevel) {
      LODOP.SET_PRINT_STYLEA(0, 'QRCodeErrorLevel', s.QRCodeErrorLevel);
    }
  }
}

export function applyLodopBarcodeTextStyle(LODOP: LodopInstance, item: PrintTemplateItem, codeType: string) {
  const s = item.style || {};
  const showTextExplicit = s.ShowBarText;
  const showText = showTextExplicit === true || (showTextExplicit !== false && !is2dBarcodeType(codeType));
  if (showText) {
    LODOP.SET_PRINT_STYLEA(0, 'ShowBarText', 1);
    const textPos = s.BarCodeTextPosition;
    if (textPos != null && textPos >= 0 && textPos <= 3) {
      LODOP.SET_PRINT_STYLEA(0, 'BarCodeTextPosition', textPos);
    }
  } else {
    LODOP.SET_PRINT_STYLEA(0, 'ShowBarText', 0);
  }
  if (!is2dBarcodeType(codeType)) {
    const captionFont = s.FontName?.trim();
    if (captionFont) {
      LODOP.SET_PRINT_STYLEA(0, 'FontName', captionFont);
    }
  }
}
