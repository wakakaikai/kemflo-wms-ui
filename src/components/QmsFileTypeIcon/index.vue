<template>
  <img class="qms-file-type-icon" :src="iconUrl" :alt="kind || 'file'" />
</template>

<script setup lang="ts">
import { getQms352FileType, type Qms352PreviewKind } from '@/utils/qms352FileType';
import pdfIcon from '@/assets/icons/qms-file-type/pdf.svg';
import wordIcon from '@/assets/icons/qms-file-type/word.svg';
import excelIcon from '@/assets/icons/qms-file-type/excel.svg';
import pptIcon from '@/assets/icons/qms-file-type/ppt.svg';
import imageIcon from '@/assets/icons/qms-file-type/image.svg';
import videoIcon from '@/assets/icons/qms-file-type/video.svg';
import audioIcon from '@/assets/icons/qms-file-type/radio.svg';
import archiveIcon from '@/assets/icons/qms-file-type/zip.svg';
import textIcon from '@/assets/icons/qms-file-type/txt.svg';
import markdownIcon from '@/assets/icons/qms-file-type/md.svg';
import codeIcon from '@/assets/icons/qms-file-type/code.svg';
import otherIcon from '@/assets/icons/qms-file-type/other.svg';

const props = defineProps<{
  /** 根据文件名后缀推断图标 */
  fileName?: string;
  /** 直接指定类型，优先级高于 fileName */
  kind?: Qms352PreviewKind;
}>();

const iconMap: Record<string, string> = {
  pdf: pdfIcon,
  word: wordIcon,
  excel: excelIcon,
  ppt: pptIcon,
  image: imageIcon,
  video: videoIcon,
  audio: audioIcon,
  archive: archiveIcon,
  text: textIcon,
  markdown: markdownIcon,
  code: codeIcon,
  other: otherIcon,
  '': otherIcon
};

const kind = computed(() => props.kind || getQms352FileType(props.fileName));

const iconUrl = computed(() => iconMap[kind.value || 'other'] || otherIcon);
</script>

<style scoped lang="scss">
.qms-file-type-icon {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  object-fit: contain;
  vertical-align: middle;
}
</style>
