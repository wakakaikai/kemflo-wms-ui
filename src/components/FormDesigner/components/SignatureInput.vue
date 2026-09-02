<template>
  <div class="signature-input">
    <div v-if="modelValue" class="signature-preview">
      <el-image :src="modelValue" fit="contain" />
    </div>
    <el-button class="signature-trigger" :disabled="disabled" @click="openDialog">
      <el-icon><EditPen /></el-icon>
      <span>{{ buttonText }}</span>
    </el-button>

    <el-dialog v-model="visible" width="520px" append-to-body destroy-on-close class="signature-dialog" :show-close="false" @opened="initCanvas">
      <template #header>
        <div class="signature-dialog-head">
          <span>请在下方空白处横向书写签名</span>
          <el-button link icon="Close" @click="visible = false" />
        </div>
      </template>

      <div class="signature-board">
        <canvas ref="canvasRef" class="signature-canvas" @pointerdown="startDraw" @pointermove="draw" @pointerup="stopDraw" @pointerleave="stopDraw" @pointercancel="stopDraw" />
      </div>

      <template #footer>
        <div class="signature-footer">
          <el-button @click="clearCanvas">清空</el-button>
          <el-button type="primary" @click="saveSignature">完成</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { Close, EditPen } from '@element-plus/icons-vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    buttonText?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    buttonText: '添加签名',
    disabled: false
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const visible = ref(false);
const drawing = ref(false);
const canvasRef = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D | null = null;

function openDialog() {
  if (props.disabled) return;
  visible.value = true;
}

async function initCanvas() {
  await nextTick();
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#303133';
  resetCanvasBackground(rect.width, rect.height);

  if (props.modelValue) {
    const img = new Image();
    img.onload = () => ctx?.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = props.modelValue;
  }
}

function resetCanvasBackground(width?: number, height?: number) {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width || rect.width, height || rect.height);
}

function getPoint(event: PointerEvent) {
  const rect = canvasRef.value!.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startDraw(event: PointerEvent) {
  if (!ctx || !canvasRef.value) return;
  drawing.value = true;
  canvasRef.value.setPointerCapture(event.pointerId);
  const point = getPoint(event);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function draw(event: PointerEvent) {
  if (!drawing.value || !ctx) return;
  const point = getPoint(event);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function stopDraw(event: PointerEvent) {
  if (!drawing.value) return;
  drawing.value = false;
  canvasRef.value?.releasePointerCapture(event.pointerId);
}

function clearCanvas() {
  resetCanvasBackground();
}

function saveSignature() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  emit('update:modelValue', canvas.toDataURL('image/png'));
  visible.value = false;
}
</script>

<style scoped>
.signature-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.signature-trigger {
  height: 34px;
  padding: 0 14px;
  border-radius: 0;
  background: #fff;
  color: #303133;
}
.signature-trigger :deep(.el-icon) {
  margin-right: 4px;
}
.signature-preview {
  width: 160px;
  height: 56px;
  border: 1px solid #dcdfe6;
  background: #fff;
}
.signature-preview :deep(.el-image) {
  width: 100%;
  height: 100%;
}
.signature-board {
  padding: 4px;
  border: 1px solid #ebeef5;
  background: #fff;
}
.signature-canvas {
  display: block;
  width: 100%;
  height: 240px;
  border: 1px dashed #d8dce5;
  background: #fff;
  touch-action: none;
}
.signature-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style>
.signature-dialog .el-dialog__header {
  padding: 12px 14px 8px;
  margin-right: 0;
}
.signature-dialog .el-dialog__body {
  padding: 0 14px;
}
.signature-dialog .el-dialog__footer {
  padding: 10px 14px 12px;
}
.signature-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #606266;
  font-size: 14px;
}
</style>
