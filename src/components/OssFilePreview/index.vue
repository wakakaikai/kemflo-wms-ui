<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="92%"
    top="4vh"
    destroy-on-close
    draggable
    append-to-body
    @closed="handleClosed"
  >
    <div v-loading="loading" class="oss-preview-body">
      <video v-if="previewKind === 'video' && mediaUrl" class="oss-preview-video" controls :src="mediaUrl" />
      <VuePdfApp
        v-else-if="pdfUrl && previewKind === 'pdf'"
        class="oss-preview-pdf"
        :pdf="pdfUrl"
        :config="pdfConfig"
        :file-name="previewFileName"
        theme="light"
      />
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="downloading" @click="handleDownload">下载</el-button>
    </template>
  </el-dialog>

  <div ref="galleryRef" class="oss-preview-gallery">
    <img v-for="item in galleryImages" :key="item.key" :src="item.src" :alt="item.name" />
  </div>
</template>

<script setup lang="ts">
import VuePdfApp from 'vue3-pdf-app';
import 'vue3-pdf-app/dist/icons/main.css';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import { fetchOssDownloadArrayBuffer } from '@/api/system/oss';
import { getQms352FileType, isQms352NoPreviewType, type Qms352PreviewKind } from '@/utils/qms352FileType';

export interface OssPreviewFile {
  ossId: string | number;
  fileName?: string;
  originalName?: string;
  url?: string;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const visible = ref(false);
const loading = ref(false);
const downloading = ref(false);
const previewKind = ref<Qms352PreviewKind>('');
const dialogTitle = ref('文件预览');
const currentFile = ref<OssPreviewFile | null>(null);
const pdfUrl = ref('');
const previewFileName = ref('');
const mediaUrl = ref('');
const galleryImages = ref<{ key: string; name: string; src: string }[]>([]);
const galleryRef = ref<HTMLDivElement>();
let galleryViewer: Viewer | null = null;

/** 与 QMS PC 端 pdf 预览工具栏接近（含附件侧栏）。 */
const pdfConfig = {
  sidebar: {
    viewThumbnail: true,
    viewOutline: true,
    viewAttachments: true
  },
  secondaryToolbar: {
    secondaryPresentationMode: true,
    secondaryOpenFile: false,
    secondaryPrint: true,
    secondaryDownload: true,
    secondaryViewBookmark: true,
    firstPage: true,
    lastPage: true,
    pageRotateCw: true,
    pageRotateCcw: true,
    cursorSelectTool: true,
    cursorHandTool: true,
    scrollVertical: true,
    scrollHorizontal: true,
    scrollWrapped: true,
    spreadNone: true,
    spreadOdd: true,
    spreadEven: true,
    documentProperties: true
  },
  toolbar: {
    toolbarViewerLeft: {
      findbar: true,
      previous: true,
      next: true,
      pageNumber: true
    },
    toolbarViewerRight: {
      presentationMode: true,
      openFile: false,
      print: true,
      download: false,
      viewBookmark: true
    },
    toolbarViewerMiddle: {
      zoomOut: true,
      zoomIn: true,
      scaleSelectContainer: true
    }
  },
  errorWrapper: true
};

const displayName = (file: OssPreviewFile) => file.originalName || file.fileName || String(file.ossId);

const revokeIfBlob = (url: string) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const resetState = () => {
  revokeIfBlob(pdfUrl.value);
  revokeIfBlob(mediaUrl.value);
  pdfUrl.value = '';
  previewFileName.value = '';
  mediaUrl.value = '';
  previewKind.value = '';
  currentFile.value = null;
  galleryImages.value.forEach((item) => revokeIfBlob(item.src));
  galleryImages.value = [];
  galleryViewer?.destroy();
  galleryViewer = null;
};

const arrayBufferToObjectUrl = (buffer: ArrayBuffer, mime: string) => {
  return URL.createObjectURL(new Blob([buffer], { type: mime }));
};

const loadOssBuffer = async (ossId: string | number) => {
  const response = await fetchOssDownloadArrayBuffer(ossId);
  return response.data as ArrayBuffer;
};

const openImageGallery = async (files: OssPreviewFile[], focusOssId: string | number) => {
  loading.value = true;
  try {
    const loaded: { key: string; name: string; src: string }[] = [];
    for (const file of files) {
      const buffer = await loadOssBuffer(file.ossId);
      loaded.push({
        key: String(file.ossId),
        name: displayName(file),
        src: arrayBufferToObjectUrl(buffer, 'image/jpeg')
      });
    }
    galleryImages.value = loaded;
    await nextTick();
    galleryViewer?.destroy();
    if (galleryRef.value) {
      galleryViewer = new Viewer(galleryRef.value, {
        zIndex: 9999,
        url: 'src',
        hidden() {
          galleryViewer?.destroy();
          galleryViewer = null;
        }
      });
      const index = loaded.findIndex((item) => item.key === String(focusOssId));
      galleryViewer.view(index >= 0 ? index : 0);
    }
  } finally {
    loading.value = false;
  }
};

const openPdf = async (file: OssPreviewFile) => {
  loading.value = true;
  visible.value = true;
  dialogTitle.value = displayName(file);
  previewFileName.value = displayName(file);
  try {
    const buffer = await loadOssBuffer(file.ossId);
    pdfUrl.value = arrayBufferToObjectUrl(buffer, 'application/pdf');
  } finally {
    loading.value = false;
  }
};

const openVideo = async (file: OssPreviewFile) => {
  loading.value = true;
  visible.value = true;
  dialogTitle.value = displayName(file);
  try {
    const buffer = await loadOssBuffer(file.ossId);
    mediaUrl.value = arrayBufferToObjectUrl(buffer, 'video/mp4');
  } finally {
    loading.value = false;
  }
};

const downloadDirect = (file: OssPreviewFile) => {
  downloading.value = true;
  try {
    proxy?.$download.oss(file.ossId);
  } finally {
    downloading.value = false;
  }
};

/** 预览 WMS sys_oss 文件（需 system:oss:download 权限）。 */
const open = async (file: OssPreviewFile, imageGroup?: OssPreviewFile[]) => {
  if (file?.ossId === null || file?.ossId === undefined || file?.ossId === '') {
    proxy?.$modal.msgWarning('文件不可用');
    return;
  }
  resetState();
  currentFile.value = file;
  const name = displayName(file);
  previewKind.value = getQms352FileType(name);

  if (isQms352NoPreviewType(previewKind.value) || previewKind.value === 'word' || previewKind.value === 'excel' || previewKind.value === 'ppt') {
    downloadDirect(file);
    return;
  }
  if (previewKind.value === 'image') {
    const group = (imageGroup || [file]).filter((item) => getQms352FileType(displayName(item)) === 'image');
    await openImageGallery(group.length ? group : [file], file.ossId);
    return;
  }
  if (previewKind.value === 'video') {
    await openVideo(file);
    return;
  }
  if (previewKind.value === 'pdf') {
    await openPdf(file);
    return;
  }
  downloadDirect(file);
};

const handleDownload = () => {
  if (currentFile.value) {
    downloadDirect(currentFile.value);
  }
};

const handleClosed = () => {
  resetState();
};

onUnmounted(resetState);

defineExpose({ open });
</script>

<style scoped lang="scss">
.oss-preview-body {
  min-height: 70vh;
}

.oss-preview-pdf {
  height: 72vh;
}

.oss-preview-video {
  display: block;
  width: 100%;
  max-height: 72vh;
  margin: 0 auto;
  background: #000;
}

.oss-preview-gallery {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
