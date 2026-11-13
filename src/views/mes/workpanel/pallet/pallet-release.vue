<template>
  <div class="app-container pallet-panel" v-loading="loading" element-loading-text="加载中，请稍候！">
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="panel-heading">
          <div class="heading-main">
            <span class="heading-icon"><el-icon><DocumentAdd /></el-icon></span>
            <div>
              <h3 class="heading-title">栈板 / 外箱条码下达</h3>
              <p class="heading-desc">选择产品与条码类型，系统批量生成条码并自动导出</p>
            </div>
          </div>
          <div v-if="resultMessage" class="status-alert">
            <el-alert show-icon :closable="false" :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
              <template #icon>
                <Bell />
              </template>
            </el-alert>
          </div>
        </div>
      </template>
      <div class="section-label">下达参数</div>
      <el-form ref="formRef" :model="searchForm" :rules="rules" label-position="top" class="work-form">
        <el-row :gutter="18">
          <el-col :xs="24" :sm="24" :md="10">
            <div class="form-field">
              <el-form-item label="选择产品" prop="item">
                <el-select v-model="searchForm.item" filterable clearable placeholder="请选择需要下达条码的产品" class="w-full" @change="handleItemChange">
                  <el-option v-for="opt in itemPalletOptions" :key="opt.item" :label="opt.description ? `${opt.item} - ${opt.description}` : opt.item" :value="opt.item" />
                </el-select>
              </el-form-item>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="7">
            <div class="form-field">
              <el-form-item label="条码类型" prop="palletLevel">
                <el-radio-group v-model="searchForm.palletLevel">
                  <el-radio-button value="1">栈板条码</el-radio-button>
                  <el-radio-button value="2">外箱条码</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="7">
            <div class="form-field">
              <el-form-item label="待下达数量" prop="qty">
                <el-input-number v-model="searchForm.qty" :min="1" :precision="0" class="w-full" controls-position="right" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="action-bar release-action">
              <span class="action-tip">下达成功后将自动下载条码Excel文件</span>
              <el-button type="primary" class="primary-action" @click="releasePallet">下达并导出条码</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="WorkPanelPalletRelease" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { Bell, DocumentAdd } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { exportWorkPanelPalletExcel, generateWorkPanelPallet, listWorkPanelItemPallet } from '@/api/mes/workpanel/pallet';
import type { WorkPanelItemPalletVO } from '@/api/mes/workpanel/pallet/types';

const isApiSuccess = (res: any) => res?.code === HttpStatus.SUCCESS || res?.success === true;

interface ReleaseForm {
  item?: string;
  palletLevel?: string;
  qty?: number;
  palletNum?: number;
}

const searchForm = reactive<ReleaseForm>({
  palletLevel: '1'
});

const itemPalletOptions = ref<WorkPanelItemPalletVO[]>([]);
const itemPalletMap = new Map<string, WorkPanelItemPalletVO>();
const loading = ref(false);
const formRef = ref<FormInstance>();
const resultMessage = ref('');
const resultStatus = ref(false);

const setResult = (message: string, success = false) => {
  resultMessage.value = message;
  resultStatus.value = success;
};

const getErrorMessage = (error: any, fallback: string) => error?.msg || error?.response?.data?.msg || fallback;

const rules: FormRules = {
  item: [{ required: true, message: '请选择产品!', trigger: 'change' }],
  palletLevel: [{ required: true, message: '请选择条码类型', trigger: 'change' }],
  qty: [{ required: true, message: '请填写下达数量!', trigger: 'blur' }]
};

const loadItemPallet = async () => {
  try {
    const res: any = await listWorkPanelItemPallet();
    if (!isApiSuccess(res)) {
      throw res;
    }
    const list = (res.data || []) as WorkPanelItemPalletVO[];
    itemPalletOptions.value = list;
    itemPalletMap.clear();
    list.forEach((obj) => itemPalletMap.set(obj.item, obj));
  } catch (error: any) {
    setResult(getErrorMessage(error, '获取产品栈板信息失败'), false);
  }
};

const handleItemChange = (value: string) => {
  if (itemPalletMap.has(value)) {
    const row = itemPalletMap.get(value)!;
    if (row.palletNum != null) {
      searchForm.palletNum = row.palletNum;
    }
  }
};

const releasePallet = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  resultMessage.value = '';
  loading.value = true;
  try {
    const res: any = await generateWorkPanelPallet({
      qty: searchForm.qty,
      item: searchForm.item,
      palletLevel: parseInt(searchForm.palletLevel || '1', 10)
    });
    if (!isApiSuccess(res)) {
      setResult(res?.msg || '操作失败！', false);
      return;
    }
    const exportPayload = {
      batchId: res.data?.batchId,
      item: searchForm.item,
      exportColumn: [
        { field: 'rowId', title: '序号' },
        { field: 'palletNo', title: '栈板号/箱号' },
        { field: 'item', title: '物料' },
        { field: 'itemDesc', title: '物料描述' },
        { field: 'qty', title: '数量' }
      ]
    };
    const exRes = await exportWorkPanelPalletExcel(exportPayload);
    const blob = exRes as unknown as Blob;
    const elink = document.createElement('a');
    elink.download = '栈板/外箱条码';
    elink.style.display = 'none';
    elink.href = window.URL.createObjectURL(blob);
    document.body.appendChild(elink);
    elink.click();
    window.URL.revokeObjectURL(elink.href);
    document.body.removeChild(elink);
    setResult('操作成功！', true);
  } catch (error: any) {
    setResult(getErrorMessage(error, '条码下达或导出失败'), false);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadItemPallet();
});
</script>

<style scoped lang="scss">
@use './pallet-workpanel' as workpanel;

@include workpanel.theme;

.release-action {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px dashed #dfe7f2;
}

.action-tip {
  margin-right: auto;
  color: #97a3b4;
  font-size: 13px;
}
</style>
