<template>
  <div class="settings-dialog-content">
    <div v-if="loading" class="loading-settings">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>正在加载打印设置...</p>
    </div>

    <div v-else>
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 打印机设置 -->
        <el-tab-pane label="打印机设置" name="printer">
          <div class="settings-section">
            <h4>选择打印机</h4>
            <div class="printer-selection">
              <el-select v-model="localSelectedPrinter" placeholder="请选择打印机" style="width: 400px; margin-right: 10px" filterable @change="onPrinterChange">
                <el-option v-for="printer in printers" :key="printer.name" :label="printer.name" :value="printer.name">
                  <div class="printer-option">
                    <span>{{ printer.name }}</span>
                    <span v-if="printer.isDefault" class="printer-default">默认</span>
                  </div>
                </el-option>
              </el-select>
              <el-button @click="refreshPrinters">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>

          <div class="settings-section">
            <h4>纸张设置</h4>
            <div class="paper-selection">
              <el-select v-model="selectedPaper" placeholder="请先选择打印机" style="width: 300px; margin-right: 10px" :disabled="!localSelectedPrinter" @change="onPaperChange">
                <el-option v-for="paper in paperList" :key="paper.value" :label="paper.label" :value="paper.value">
                  <div class="paper-option">
                    <span>{{ paper.label }}</span>
                  </div>
                </el-option>
              </el-select>

              <el-button @click="refreshPapers" :disabled="!localSelectedPrinter"> 刷新纸张 </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 页面设置 -->
        <el-tab-pane label="页面设置" name="page">
          <div class="settings-section">
            <h4>页面布局</h4>
            <el-form :model="pageSettings" label-width="120px">
              <el-form-item label="页面方向">
                <el-radio-group v-model="pageSettings.orientation">
                  <el-radio :label="1">纵向</el-radio>
                  <el-radio :label="2">横向</el-radio>
                  <el-radio :label="0">默认</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="缩放比例">
                <el-select v-model="pageSettings.zoom" style="width: 200px">
                  <el-option label="按默认(100%)" value="100%" />
                  <el-option label="按整宽(变形)" value="Full-Width" />
                  <el-option label="按整高(变形)" value="Full-Height" />
                  <el-option label="按整页(变形)" value="Full-Page" />
                  <el-option label="整宽不变形" value="Auto-Width" />
                  <el-option label="整高不变形" value="Auto-Height" />
                  <el-option label="宽度放大200%" value="Width:200%" />
                  <el-option label="高度放大200%" value="Height:200%" />
                  <el-option label="宽和高都200%" value="Width:200%;Height:200%" />
                  <el-option label="整缩55%" value="55%" />
                </el-select>
              </el-form-item>

              <el-form-item label="页边距(mm)">
                <div class="margin-controls">
                  <div class="margin-item">
                    <span class="margin-label">上:</span>
                    <el-input-number v-model="pageSettings.marginTop" :min="0" :max="100" size="small" style="width: 100px" />
                  </div>
                  <div class="margin-item">
                    <span class="margin-label">下:</span>
                    <el-input-number v-model="pageSettings.marginBottom" :min="0" :max="100" size="small" style="width: 100px" />
                  </div>
                  <div class="margin-item">
                    <span class="margin-label">左:</span>
                    <el-input-number v-model="pageSettings.marginLeft" :min="0" :max="100" size="small" style="width: 100px" />
                  </div>
                  <div class="margin-item">
                    <span class="margin-label">右:</span>
                    <el-input-number v-model="pageSettings.marginRight" :min="0" :max="100" size="small" style="width: 100px" />
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h4>打印范围</h4>
            <el-form :model="pageSettings" label-width="120px">
              <el-form-item label="页码范围">
                <el-input v-model="pageSettings.pageRange" placeholder="例如: 1-3,5,7-9" style="width: 200px" />
              </el-form-item>

              <el-form-item label="并排页数">
                <el-select v-model="pageSettings.pagesPerSheet" style="width: 200px">
                  <el-option :label="1" :value="1" />
                  <el-option :label="2" :value="2" />
                  <el-option :label="4" :value="4" />
                  <el-option :label="6" :value="6" />
                  <el-option :label="9" :value="9" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 打印设置 -->
        <el-tab-pane label="打印设置" name="print">
          <div class="settings-section">
            <h4>打印质量</h4>
            <el-form :model="printSettings" label-width="120px">
              <el-form-item label="打印份数">
                <el-input-number v-model="localCopies" :min="1" :max="9999" controls-position="right" style="width: 150px" />
              </el-form-item>

              <el-form-item label="打印质量">
                <el-select v-model="printSettings.quality" style="width: 200px">
                  <el-option label="草稿" value="draft" />
                  <el-option label="正常" value="normal" />
                  <el-option label="高质量" value="high" />
                </el-select>
              </el-form-item>

              <el-form-item label="双面打印">
                <el-select v-model="printSettings.duplex" style="width: 200px">
                  <el-option label="不双面" :value="1" />
                  <el-option label="双面/普通" :value="2" />
                  <el-option label="双面/小册子" :value="3" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Loading } from '@element-plus/icons-vue';

const props = defineProps({
  selectedPrinter: {
    type: String,
    default: ''
  },
  copies: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['update:selectedPrinter', 'update:copies', 'refreshPrinters', 'refreshPapers']);

const activeTab = ref('printer');
const loading = ref(false);
const printers = ref<Array<{ name: string; isDefault: boolean }>>([]);
const localSelectedPrinter = ref('');
const paperList = ref<Array<{ value: string; label: string }>>([]);
const selectedPaper = ref('');

// 页面设置
const pageSettings = ref({
  orientation: 1, // 1=纵向, 2=横向, 0=默认
  zoom: '100%',
  marginTop: 5,
  marginBottom: 5,
  marginLeft: 5,
  marginRight: 5,
  pageRange: '',
  pagesPerSheet: 1
});

// 打印设置
const printSettings = ref({
  quality: 'normal',
  duplex: 1,
  paperSource: 0
});

// 本地副本
const localCopies = ref(1);

// 加载纸张列表函数
const loadPaperList = async () => {
  if (localSelectedPrinter.value) {
    emit('refreshPapers', localSelectedPrinter.value);
  }
};

// 加载设置
const loadSettings = async () => {
  loading.value = true;
  try {
    // 触发父组件刷新打印机列表
    emit('refreshPrinters');

    // 加载本地存储的设置
    const savedSettings = localStorage.getItem('printSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        pageSettings.value = settings.pageSettings || pageSettings.value;
        printSettings.value = settings.printSettings || printSettings.value;
        selectedPaper.value = settings.paper || '';
        localSelectedPrinter.value = settings.printer || props.selectedPrinter;
        localCopies.value = settings.copies || props.copies;
      } catch (e) {
        console.error('加载设置失败:', e);
      }
    }
  } finally {
    loading.value = false;
  }
};

// 保存设置
const saveSettings = () => {
  const settings = {
    printer: localSelectedPrinter.value,
    paper: selectedPaper.value,
    copies: localCopies.value,
    pageSettings: pageSettings.value,
    printSettings: printSettings.value
  };

  localStorage.setItem('printSettings', JSON.stringify(settings));

  // 更新父组件
  emit('update:selectedPrinter', localSelectedPrinter.value);
  emit('update:copies', localCopies.value);

  ElMessage.success('设置已保存');
};

// 刷新打印机列表
const refreshPrinters = () => {
  emit('refreshPrinters');
};

// 刷新纸张列表
const refreshPapers = () => {
  if (localSelectedPrinter.value) {
    emit('refreshPapers', localSelectedPrinter.value);
  }
};

// 打印机变更
const onPrinterChange = () => {
  paperList.value = [];
  selectedPaper.value = '';
  if (localSelectedPrinter.value) {
    loadPaperList();
  }
};

// 纸张变更
const onPaperChange = () => {
  // 可以在这里处理纸张变更逻辑
};

// 监听props变化
watch(
  () => props.selectedPrinter,
  (newVal) => {
    localSelectedPrinter.value = newVal;
    if (newVal) {
      // 使用nextTick确保DOM更新完成
      nextTick(() => {
        loadPaperList();
      });
    }
  },
  { immediate: true }
);

watch(
  () => props.copies,
  (newVal) => {
    localCopies.value = newVal;
  },
  { immediate: true }
);

// 暴露方法给父组件
defineExpose({
  loadSettings,
  saveSettings,
  setPrinters: (list: Array<{ name: string; isDefault: boolean }>) => {
    printers.value = list;
  },
  setPaperList: (list: Array<{ value: string; label: string }>) => {
    paperList.value = list;
  }
});
</script>

<style scoped>
.settings-dialog-content {
  min-height: 400px;
}

.loading-settings {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.settings-tabs {
  margin-top: 10px;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h4 {
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.printer-selection {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.paper-selection {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.printer-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.printer-default {
  background-color: #e8f4ff;
  color: #409eff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
}

.paper-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.margin-controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.margin-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.margin-label {
  min-width: 30px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .margin-controls {
    grid-template-columns: 1fr;
  }

  .printer-selection,
  .paper-selection {
    flex-direction: column;
    align-items: flex-start;
  }

  .printer-selection .el-select,
  .paper-selection .el-select {
    width: 100% !important;
    margin-bottom: 10px;
  }
}
</style>
