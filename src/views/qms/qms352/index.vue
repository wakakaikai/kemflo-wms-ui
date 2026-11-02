<template>
  <div class="qms352-page">
    <section class="page-hero">
      <div class="hero-copy">
        <div class="hero-eyebrow"><span class="eyebrow-dot"></span>QMS · SUPPLIER QUALITY</div>
        <h1>质量数据交换中心</h1>
        <p>集中处理检验数据归档与质量附件上传，让批量导入、异常报告关联更清晰。</p>
        <div class="hero-tags">
          <span><i class="tag-dot green"></i>模板化导入</span>
          <span><i class="tag-dot blue"></i>附件 ID 回填</span>
          <span><i class="tag-dot orange"></i>格式自动校验</span>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="visual-orbit orbit-one"></div>
        <div class="visual-orbit orbit-two"></div>
        <div class="visual-card card-back">
          <i-ep-document />
        </div>
        <div class="visual-card card-front">
          <i-ep-upload-filled />
        </div>
        <span class="visual-status">READY</span>
      </div>
    </section>

    <section class="channel-switcher">
      <button type="button" class="channel-card" :class="{ active: activeTab === 'data' }" @click="activeTab = 'data'">
        <span class="channel-icon excel"><i-ep-document /></span>
        <span class="channel-content"><strong>Excel 数据导入</strong><small>批量归档检验及物料异常业务数据</small></span>
        <span class="channel-state">01</span>
      </button>
      <button type="button" class="channel-card" :class="{ active: activeTab === 'attachment' }" @click="activeTab = 'attachment'">
        <span class="channel-icon attachment"><i-ep-paperclip /></span>
        <span class="channel-content"><strong>质量附件管理</strong><small>上传图片、PDF、8D 报告并获取附件 ID</small></span>
        <span class="channel-state">02</span>
      </button>
    </section>

    <div class="channel-notice">
      <span class="notice-icon"><i-ep-info-filled /></span>
      <div>
        <strong>请按文件用途选择通道</strong>
        <p>Excel 仅推送业务数据；图片、PDF 与 8D 报告需先上传附件，再将附件 ID 填入物料异常模板。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="content-tabs">
      <el-tab-pane name="data">
        <template #label><span>Excel 数据导入</span></template>
        <section class="workspace-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">DATA IMPORT</span>
              <h2>业务数据批量导入</h2>
              <p>选择归档业务，下载对应模板，填写完成后上传并执行导入。</p>
            </div>
            <span class="heading-badge">XLS / XLSX</span>
          </div>

          <el-alert v-if="dataResultMessage" class="result-alert" show-icon :closable="true" :type="dataResultType" @close="dataResultMessage = ''">{{ dataResultMessage }}</el-alert>

          <div class="step-card">
            <div class="step-index">01</div>
            <div class="step-main">
              <div class="step-title"><strong>选择数据类型</strong><span>不同业务类型使用独立模板，请勿混用</span></div>
              <el-radio-group v-model="bizType" class="biz-selector">
                <el-radio-button value="receiveCompleted"
                  ><span class="radio-label"><i-ep-circle-check />已完成检验归档</span></el-radio-button
                >
                <el-radio-button value="materialException"
                  ><span class="radio-label"><i-ep-warning />物料异常归档</span></el-radio-button
                >
              </el-radio-group>
            </div>
            <el-button v-hasPermi="['qms352:excel:import']" class="template-button" type="primary" plain icon="Download" @click="downloadTemplate">下载对应模板</el-button>
          </div>

          <div class="step-card upload-step">
            <div class="step-index">02</div>
            <div class="step-main full-width">
              <div class="step-title"><strong>上传填写后的模板</strong><span>上传前请确认必填列和日期、数量格式</span></div>
              <el-upload ref="dataUploadRef" class="modern-upload" drag :limit="1" accept=".xlsx,.xls" :headers="globalHeaders()" :action="dataUploadUrl" :disabled="dataUploading" :before-upload="beforeDataUpload" :on-progress="onDataProgress" :on-success="onDataSuccess" :on-error="onDataError" :auto-upload="false">
                <div class="upload-illustration">
                  <i-ep-upload-filled />
                </div>
                <div class="upload-title">拖放 Excel 文件到这里</div>
                <div class="upload-subtitle">或者 <em>浏览本地文件</em>，单次仅处理一个业务表</div>
                <div class="upload-formats"><span>.XLS</span><span>.XLSX</span><small>业务表不会保存为 QMS 附件</small></div>
              </el-upload>
            </div>
          </div>

          <div class="action-bar">
            <div class="action-tip">
              <i-ep-lock />
              <span>文件通过格式校验后才会提交，导入结果将在当前页面返回。</span>
            </div>
            <el-button v-hasPermi="['qms352:excel:import']" type="primary" size="large" :loading="dataUploading" icon="Upload" @click="submitData">{{ dataUploading ? '正在导入' : '开始导入数据' }}</el-button>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane name="attachment">
        <template #label><span>质量附件管理</span></template>
        <section class="workspace-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">ATTACHMENT CENTER</span>
              <h2>质量附件上传</h2>
              <p>上传检验图片、PDF、Word 或压缩包，复制返回的附件 ID 用于业务数据关联。</p>
            </div>
            <span class="heading-badge">MULTIPLE</span>
          </div>

          <el-alert v-if="attachmentResultMessage" class="result-alert" show-icon :closable="true" :type="attachmentResultType" @close="attachmentResultMessage = ''">{{ attachmentResultMessage }}</el-alert>

          <div class="attachment-layout">
            <div class="attachment-config">
              <div class="config-icon">
                <i-ep-folder-opened />
              </div>
              <div class="config-copy"><strong>附件归属模块</strong><span>用于区分附件存储目录，只允许字母、数字、下划线和横杠</span></div>
              <el-input v-model="fileModule" placeholder="external" class="module-input">
                <template #prefix>
                  <i-ep-collection-tag />
                </template>
              </el-input>
            </div>

            <div class="attachment-warning">
              <i-ep-warning-filled />
              <span>此通道不接收 Excel。上传完成后，请复制附件 ID 并填写到物料异常模板的“附件ID”或“8D报告ID”。</span>
            </div>

            <el-upload class="modern-upload attachment-upload" drag multiple :headers="attachmentHeaders" :action="attachmentUploadUrl" :before-upload="beforeAttachmentUpload" :on-success="onAttachmentSuccess" :on-error="onAttachmentError" accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.doc,.docx,.zip,.rar">
              <div class="upload-illustration attachment-icon">
                <i-ep-paperclip />
              </div>
              <div class="upload-title">拖放质量附件到这里</div>
              <div class="upload-subtitle">或者 <em>浏览本地文件</em>，支持同时选择多个附件</div>
              <div class="upload-formats"><span>PDF</span><span>IMAGE</span><span>WORD</span><span>ZIP / RAR</span></div>
            </el-upload>
          </div>

          <div class="record-section">
            <div class="record-heading">
              <div>
                <strong>本次上传记录</strong><span>共 {{ attachments.length }} 个附件</span>
              </div>
              <span class="record-hint">附件 ID 可直接复制</span>
            </div>
            <el-table :data="attachments" class="attachment-table" empty-text="暂无上传记录" row-key="uid">
              <el-table-column label="文件" prop="fileName" min-width="220">
                <template #default="scope">
                  <div class="file-cell">
                    <span class="file-icon"><i-ep-document /></span
                    ><span
                      ><strong>{{ scope.row.fileName }}</strong
                      ><small>{{ scope.row.fileModule }}</small></span
                    >
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="附件 ID" prop="attachmentId" min-width="220">
                <template #default="scope"
                  ><code class="attachment-id">{{ scope.row.attachmentId || '-' }}</code></template
                >
              </el-table-column>
              <el-table-column label="上传时间" prop="uploadTime" width="190" />
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope">
                  <el-button link type="primary" icon="CopyDocument" :disabled="!scope.row.attachmentId" @click="copyId(scope.row.attachmentId)">复制 ID</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="Qms352Upload" lang="ts">
import { UploadFile, UploadRawFile } from 'element-plus';
import { globalHeaders } from '@/utils/request';
import { Qms352AttachmentRecord, Qms352ExcelBizType } from '@/api/qms/qms352/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const activeTab = ref('data');
const bizType = ref<Qms352ExcelBizType>('receiveCompleted');
const dataUploading = ref(false);
const dataUploadRef = ref<ElUploadInstance>();
const dataResultMessage = ref('');
const dataResultType = ref<'success' | 'error'>('success');
const attachmentResultMessage = ref('');
const attachmentResultType = ref<'success' | 'error'>('success');
const fileModule = ref('external');
const attachments = ref<Qms352AttachmentRecord[]>([]);

const dataUploadUrl = computed(() => `${import.meta.env.VITE_APP_BASE_API}/qms352/excel/importData?bizType=${bizType.value}`);
const attachmentUploadUrl = `${import.meta.env.VITE_APP_BASE_API}/qms352/file/external/upload`;
const attachmentHeaders = computed(() => ({
  ...globalHeaders(),
  fileModule: fileModule.value || 'external'
}));

const downloadTemplate = () => {
  const nameMap: Record<Qms352ExcelBizType, string> = {
    receiveAndStart: 'qms352_来料发起检验模板',
    receiveCompleted: 'qms352_已完成检验归档模板',
    materialException: 'qms352_物料异常归档模板'
  };
  const urlMap: Record<Qms352ExcelBizType, string> = {
    receiveAndStart: 'qms352/supplier-quality/iqc/documents/receiveAndStart/importTemplate',
    receiveCompleted: 'qms352/supplier-quality/iqc/documents/receiveCompleted/importTemplate',
    materialException: 'qms352/supplier-quality/iqc/materialException/receiveCompleted/importTemplate'
  };
  proxy?.download(urlMap[bizType.value], {}, `${nameMap[bizType.value]}_${Date.now()}.xlsx`);
};

const isExcel = (name: string) => /\.xlsx?$/i.test(name);

const beforeDataUpload = (file: UploadRawFile) => {
  if (!isExcel(file.name)) {
    proxy?.$modal.msgError('业务数据只能上传 Excel');
    return false;
  }
  return true;
};

const onDataProgress = () => {
  dataUploading.value = true;
};

const readUploadMessage = (payload: unknown, fallback: string) => {
  if (payload == null) {
    return fallback;
  }
  if (typeof payload === 'string') {
    const text = payload.trim();
    if (!text) {
      return fallback;
    }
    try {
      return readUploadMessage(JSON.parse(text), text);
    } catch {
      return text;
    }
  }
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const message = record.msg ?? record.message ?? record.data;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return fallback;
};

const onDataSuccess = (response: any, file: UploadFile) => {
  dataUploading.value = false;
  dataUploadRef.value?.handleRemove(file);
  const message = readUploadMessage(response, '导入完成');
  const success = response?.code === 200 && !message.includes('失败');
  dataResultType.value = success ? 'success' : 'error';
  dataResultMessage.value = message;
};

const onDataError = (error: Error) => {
  dataUploading.value = false;
  dataResultType.value = 'error';
  dataResultMessage.value = readUploadMessage(error?.message, 'Excel 上传失败');
};

const submitData = () => {
  dataResultMessage.value = '';
  dataUploadRef.value?.submit();
};

const beforeAttachmentUpload = (file: UploadRawFile) => {
  if (isExcel(file.name)) {
    proxy?.$modal.msgError('Excel 业务数据请使用「Excel数据导入」，附件管理不接收表格');
    return false;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(fileModule.value || '')) {
    proxy?.$modal.msgError('文件模块只允许英文字母、数字、下划线和横杠');
    return false;
  }
  return true;
};

const onAttachmentSuccess = (response: any, file: UploadFile) => {
  if (response?.code !== 200) {
    attachmentResultType.value = 'error';
    attachmentResultMessage.value = readUploadMessage(response, '附件上传失败');
    return;
  }
  attachments.value.unshift({
    uid: String(file.uid),
    fileName: file.name,
    fileModule: fileModule.value || 'external',
    attachmentId: extractAttachmentId(response.data),
    raw: response.data,
    uploadTime: new Date().toLocaleString()
  });
  attachmentResultType.value = 'success';
  attachmentResultMessage.value = readUploadMessage(response, '附件已上传到 QMS');
};

const onAttachmentError = (error: Error) => {
  attachmentResultType.value = 'error';
  attachmentResultMessage.value = readUploadMessage(error?.message, '附件上传失败');
};

const extractAttachmentId = (data: unknown) => {
  if (data == null) {
    return '';
  }
  if (typeof data === 'string' || typeof data === 'number') {
    return String(data);
  }
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const id = record.id ?? record.fileId ?? record.attachmentId;
    return id == null ? JSON.stringify(data) : String(id);
  }
  return String(data);
};

const copyId = async (id: string) => {
  await navigator.clipboard.writeText(id);
  proxy?.$modal.msgSuccess('已复制附件ID');
};
</script>

<style scoped lang="scss">
.qms352-page {
  min-height: calc(100vh - 84px);
  padding: 20px;
  color: #1c2d42;
  background: radial-gradient(circle at 5% 0, rgba(37, 99, 235, 0.08), transparent 25%), linear-gradient(180deg, #f4f7fb 0, #f7f9fc 420px, #f3f6fa 100%);
}

.page-hero {
  position: relative;
  min-height: 210px;
  padding: 38px 44px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(115deg, rgba(6, 27, 59, 0.98), rgba(13, 63, 119, 0.95)), #0b2748;
  box-shadow: 0 18px 45px rgba(15, 45, 79, 0.15);
}

.page-hero::before,
.page-hero::after {
  position: absolute;
  content: '';
  border-radius: 50%;
  pointer-events: none;
}

.page-hero::before {
  width: 360px;
  height: 360px;
  right: -100px;
  top: -190px;
  border: 1px solid rgba(84, 176, 255, 0.2);
}

.page-hero::after {
  width: 170px;
  height: 170px;
  right: 27%;
  bottom: -145px;
  background: rgba(29, 139, 255, 0.15);
  filter: blur(20px);
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 710px;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.6px;
  color: #8ecbff;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #43d7b0;
  box-shadow: 0 0 0 5px rgba(67, 215, 176, 0.13);
}

.hero-copy h1 {
  margin: 12px 0 8px;
  font-size: 31px;
  line-height: 1.25;
  letter-spacing: 1px;
}

.hero-copy p {
  margin: 0;
  font-size: 14px;
  color: #bfd1e5;
}

.hero-tags {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.hero-tags span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #d6e5f3;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.tag-dot.green {
  background: #48d7af;
}

.tag-dot.blue {
  background: #62b2ff;
}

.tag-dot.orange {
  background: #ffb95f;
}

.hero-visual {
  position: relative;
  z-index: 2;
  width: 230px;
  height: 142px;
  flex: 0 0 230px;
}

.visual-card {
  position: absolute;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.16);
}

.visual-card svg {
  width: 34px;
  height: 34px;
}

.card-back {
  width: 94px;
  height: 112px;
  right: 74px;
  top: 8px;
  border-radius: 14px;
  color: #8bc9ff;
  background: rgba(30, 112, 186, 0.28);
  transform: rotate(-8deg);
}

.card-front {
  width: 104px;
  height: 120px;
  right: 18px;
  top: 2px;
  border-radius: 16px;
  color: #62e0bc;
  background: rgba(21, 86, 148, 0.76);
  transform: rotate(7deg);
}

.visual-orbit {
  position: absolute;
  border: 1px solid rgba(96, 180, 255, 0.22);
  border-radius: 50%;
}

.orbit-one {
  width: 205px;
  height: 86px;
  right: 0;
  top: 26px;
  transform: rotate(-18deg);
}

.orbit-two {
  width: 155px;
  height: 155px;
  right: 20px;
  top: -16px;
}

.visual-status {
  position: absolute;
  right: 6px;
  bottom: 0;
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 9px;
  letter-spacing: 1.7px;
  color: #7bf0ce;
  background: rgba(3, 23, 45, 0.72);
}

.channel-switcher {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  width: calc(100% - 64px);
  margin: -25px auto 16px;
}

.channel-card {
  position: relative;
  min-height: 88px;
  padding: 15px 52px 15px 17px;
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
  text-align: left;
  border: 1px solid #e5ebf3;
  border-radius: 14px;
  color: #273b52;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 28px rgba(30, 61, 97, 0.09);
  cursor: pointer;
  transition: 0.22s ease;
}

.channel-card:hover {
  transform: translateY(-2px);
  border-color: #b7d4f4;
  box-shadow: 0 14px 32px rgba(30, 80, 130, 0.13);
}

.channel-card.active {
  border-color: #3d8ce7;
  box-shadow:
    0 0 0 2px rgba(61, 140, 231, 0.09),
    0 14px 32px rgba(30, 80, 130, 0.13);
}

.channel-icon {
  width: 49px;
  height: 49px;
  flex: 0 0 49px;
  display: grid;
  place-items: center;
  border-radius: 13px;
}

.channel-icon svg {
  width: 23px;
  height: 23px;
}

.channel-icon.excel {
  color: #1f9b76;
  background: #e9f8f3;
}

.channel-icon.attachment {
  color: #367dcc;
  background: #eaf3ff;
}

.channel-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.channel-content strong {
  font-size: 15px;
}

.channel-content small {
  color: #8090a4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-state {
  position: absolute;
  right: 17px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 27px;
  font-weight: 800;
  font-style: italic;
  color: #e4ebf3;
}

.channel-card.active .channel-state {
  color: #d5e8fc;
}

.channel-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 13px 17px;
  border: 1px solid #dce9f7;
  border-radius: 12px;
  background: #f2f8ff;
}

.notice-icon {
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #317fcf;
  background: #dceeff;
}

.notice-icon svg {
  width: 17px;
}

.channel-notice strong {
  display: block;
  margin-bottom: 2px;
  font-size: 13px;
  color: #315271;
}

.channel-notice p {
  margin: 0;
  font-size: 12px;
  color: #6f8297;
}

.content-tabs :deep(.el-tabs__header) {
  display: none;
}

.content-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.workspace-card {
  padding: 28px;
  border: 1px solid #e7ecf3;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 26px rgba(34, 62, 93, 0.06);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 23px;
  padding-bottom: 20px;
  border-bottom: 1px solid #edf1f6;
}

.section-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.2px;
  color: #4b91dc;
}

.section-heading h2 {
  margin: 6px 0 5px;
  font-size: 21px;
  color: #20364e;
}

.section-heading p {
  margin: 0;
  font-size: 13px;
  color: #8290a2;
}

.heading-badge {
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #4f7fae;
  background: #eef5fc;
}

.result-alert {
  margin-bottom: 18px;
  border-radius: 10px;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 19px;
  margin-bottom: 16px;
  border: 1px solid #e9eef4;
  border-radius: 13px;
  background: #fbfcfe;
}

.step-index {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 800;
  color: #397fc8;
  background: #eaf3fd;
}

.step-main {
  flex: 1;
  min-width: 0;
}

.step-main.full-width {
  width: 100%;
}

.step-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 13px;
}

.step-title strong {
  font-size: 14px;
  color: #263b52;
}

.step-title span {
  font-size: 12px;
  color: #8a98aa;
}

.biz-selector :deep(.el-radio-button__inner) {
  padding: 10px 16px;
  border-color: #dfe6ee;
  box-shadow: none;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 7px;
}

.radio-label svg {
  width: 15px;
}

.template-button {
  flex: 0 0 auto;
}

.upload-step {
  align-items: flex-start;
}

.upload-step .step-index {
  margin-top: 1px;
}

.modern-upload {
  width: 100%;
}

.modern-upload :deep(.el-upload) {
  width: 100%;
}

.modern-upload :deep(.el-upload-dragger) {
  width: 100%;
  min-height: 205px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #b9cce1;
  border-radius: 13px;
  background: linear-gradient(180deg, #fafdff, #f6f9fd);
  transition: 0.2s ease;
}

.modern-upload :deep(.el-upload-dragger:hover) {
  border-color: #3f91e6;
  background: #f4f9ff;
}

.upload-illustration {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 17px;
  color: #3a88da;
  background: #e7f2fd;
  box-shadow: 0 7px 18px rgba(56, 132, 213, 0.13);
}

.upload-illustration svg {
  width: 27px;
  height: 27px;
}

.upload-illustration.attachment-icon {
  color: #8c65c9;
  background: #f1eafa;
}

.upload-title {
  font-size: 15px;
  font-weight: 650;
  color: #2e435a;
}

.upload-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #8a98aa;
}

.upload-subtitle em {
  color: #367fcf;
  font-style: normal;
  font-weight: 600;
}

.upload-formats {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 17px;
}

.upload-formats span {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
  color: #6482a0;
  background: #eaf0f6;
}

.upload-formats small {
  margin-left: 4px;
  color: #a0abb9;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 4px;
}

.action-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8391a3;
}

.action-tip svg {
  width: 15px;
  color: #60a98e;
}

.attachment-layout {
  padding: 20px;
  border: 1px solid #e9eef4;
  border-radius: 14px;
  background: #fbfcfe;
}

.attachment-config {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 15px;
}

.config-icon {
  width: 41px;
  height: 41px;
  flex: 0 0 41px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #7a62bf;
  background: #f0ebfb;
}

.config-icon svg {
  width: 20px;
}

.config-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.config-copy strong {
  font-size: 13px;
}

.config-copy span {
  font-size: 11px;
  color: #8b98a9;
}

.module-input {
  width: 240px;
}

.attachment-warning {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 15px;
  padding: 11px 13px;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.6;
  color: #8a611e;
  background: #fff8e9;
}

.attachment-warning svg {
  width: 16px;
  flex: 0 0 16px;
  margin-top: 1px;
  color: #e6a23c;
}

.attachment-upload :deep(.el-upload-dragger) {
  min-height: 190px;
}

.record-section {
  margin-top: 22px;
}

.record-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 11px;
}

.record-heading > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.record-heading strong {
  font-size: 14px;
}

.record-heading span {
  font-size: 11px;
  color: #8593a4;
}

.record-heading > div span {
  padding: 3px 8px;
  border-radius: 10px;
  color: #4b82ba;
  background: #edf5fd;
}

.attachment-table {
  border: 1px solid #edf0f4;
  border-radius: 10px;
  overflow: hidden;
}

.attachment-table :deep(th.el-table__cell) {
  height: 44px;
  color: #65758a;
  background: #f6f8fb;
}

.attachment-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #4384c8;
  background: #eaf3fc;
}

.file-icon svg {
  width: 16px;
}

.file-cell > span:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-cell strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-cell small {
  color: #94a0ae;
}

.attachment-id {
  padding: 5px 8px;
  border: 1px solid #e4eaf1;
  border-radius: 6px;
  color: #49647f;
  background: #f7f9fb;
}

@media (max-width: 900px) {
  .qms352-page {
    padding: 12px;
  }
  .page-hero {
    padding: 30px;
  }
  .hero-visual {
    display: none;
  }
  .channel-switcher {
    width: calc(100% - 24px);
    grid-template-columns: 1fr;
    margin-top: -18px;
  }
  .step-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .template-button {
    margin-left: 56px;
  }
  .attachment-config {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .module-input {
    width: calc(100% - 54px);
    margin-left: 54px;
  }
}

@media (max-width: 560px) {
  .page-hero {
    min-height: 190px;
    padding: 25px 22px;
  }
  .hero-copy h1 {
    font-size: 25px;
  }
  .hero-tags {
    gap: 12px;
    flex-wrap: wrap;
  }
  .channel-switcher {
    width: 100%;
  }
  .channel-notice {
    align-items: flex-start;
  }
  .workspace-card {
    padding: 18px;
  }
  .section-heading {
    flex-direction: column;
  }
  .heading-badge {
    display: none;
  }
  .step-index {
    display: none;
  }
  .template-button {
    width: 100%;
    margin-left: 0;
  }
  .biz-selector {
    width: 100%;
  }
  .biz-selector :deep(.el-radio-button) {
    width: 100%;
  }
  .biz-selector :deep(.el-radio-button__inner) {
    width: 100%;
  }
  .upload-formats small {
    display: none;
  }
  .action-bar {
    align-items: stretch;
    flex-direction: column;
  }
  .action-bar .el-button {
    width: 100%;
  }
  .config-icon {
    display: none;
  }
  .module-input {
    width: 100%;
    margin-left: 0;
  }
  .attachment-config {
    display: block;
  }
  .config-copy {
    margin-bottom: 10px;
  }
  .record-hint {
    display: none;
  }
}
</style>
