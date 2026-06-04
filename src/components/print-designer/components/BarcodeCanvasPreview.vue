<template>
  <div ref="wrapRef" class="pd-barcode-preview" :style="wrapStyle">
    <canvas ref="canvasRef" class="pd-barcode-preview__canvas" />
    <span v-if="unsupported2d" class="pd-barcode-preview__badge">{{ codeType }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { PrintTemplateItem } from '../types';
import { is2dBarcodeType } from '../const/lodopBarcodeTypes';
import { formatBarcodeValueForLodop, resolveBarcodeItemValue } from '../utils/lodopBarcodeValue';
import { mapLodopToJsBarcodeFormat } from '../utils/jsBarcodeFormat';

const props = defineProps<{
  item: PrintTemplateItem;
  dataRow: Record<string, unknown>;
}>();

const wrapRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const unsupported2d = ref(false);

const codeType = computed(() => props.item.style?.codeType);

const wrapStyle = computed(() => ({
  background: props.item.style?.BarcodeBgTransparent
    ? 'transparent'
    : props.item.style?.BarcodeBgColor || '#ffffff'
}));

function fitCanvasToWrap(canvas: HTMLCanvasElement, wrap: HTMLElement) {
  const cw = canvas.width;
  const ch = canvas.height;
  if (!cw || !ch) return;
  const ww = Math.max(wrap.clientWidth, 1);
  const wh = Math.max(wrap.clientHeight, 1);
  const scale = Math.min(ww / cw, wh / ch);
  canvas.style.width = `${Math.floor(cw * scale)}px`;
  canvas.style.height = `${Math.floor(ch * scale)}px`;
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.style.width = '';
  canvas.style.height = '';
}

async function renderQr(canvas: HTMLCanvasElement, wrap: HTMLElement, value: string) {
  const size = Math.max(32, Math.min(wrap.clientWidth, wrap.clientHeight, 512));
  const bg = props.item.style?.BarcodeBgTransparent
    ? '#ffffff'
    : props.item.style?.BarcodeBgColor || '#ffffff';
  const fg = props.item.style?.FontColor || '#000000';
  const ecc = props.item.style?.QRCodeErrorLevel || 'M';
  await QRCode.toCanvas(canvas, value, {
    errorCorrectionLevel: ecc,
    margin: 1,
    width: size,
    color: { dark: fg, light: bg }
  });
  fitCanvasToWrap(canvas, wrap);
}

function render1d(canvas: HTMLCanvasElement, wrap: HTMLElement, value: string) {
  const showText = props.item.style?.ShowBarText !== false;
  const bg = props.item.style?.BarcodeBgTransparent ? 'transparent' : props.item.style?.BarcodeBgColor || '#ffffff';
  const fg = props.item.style?.FontColor || '#000000';
  const barH = Math.max(24, Math.floor(wrap.clientHeight * 0.72));
  const format = mapLodopToJsBarcodeFormat(codeType.value);
  JsBarcode(canvas, value, {
    format,
    width: 2,
    height: barH,
    displayValue: showText,
    fontSize: Math.max(10, Math.min(14, Math.floor(wrap.clientHeight * 0.22))),
    margin: 2,
    background: bg,
    lineColor: fg,
    valid: () => true
  });
  fitCanvasToWrap(canvas, wrap);
}

async function render() {
  const canvas = canvasRef.value;
  const wrap = wrapRef.value;
  if (!canvas || !wrap) return;
  if (wrap.clientWidth < 2 || wrap.clientHeight < 2) return;

  unsupported2d.value = false;
  clearCanvas(canvas);

  const type = codeType.value;
  const raw = resolveBarcodeItemValue(props.item, props.dataRow);
  const value = formatBarcodeValueForLodop(type, raw);

  try {
    if (is2dBarcodeType(type)) {
      if (type === 'QRCode') {
        await renderQr(canvas, wrap, value);
        return;
      }
      unsupported2d.value = true;
      return;
    }
    render1d(canvas, wrap, value);
  } catch {
    unsupported2d.value = !!is2dBarcodeType(type);
    clearCanvas(canvas);
  }
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  void nextTick(render);
  ro = new ResizeObserver(() => void render());
  if (wrapRef.value) ro.observe(wrapRef.value);
});

onUnmounted(() => {
  ro?.disconnect();
  ro = null;
});

watch(
  () => [
    props.item.id,
    props.item.value,
    props.item.name,
    props.item.width,
    props.item.height,
    props.item.style?.codeType,
    props.item.style?.ShowBarText,
    props.item.style?.FontColor,
    props.item.style?.BarcodeBgColor,
    props.item.style?.BarcodeBgTransparent,
    props.item.style?.QRCodeErrorLevel,
    props.dataRow
  ],
  () => void nextTick(render),
  { deep: true }
);
</script>

<style scoped lang="scss">
.pd-barcode-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pd-barcode-preview__canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}
.pd-barcode-preview__badge {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: rgb(255 255 255 / 85%);
  padding: 0 4px;
  border-radius: 2px;
  pointer-events: none;
}
</style>
