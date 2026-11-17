<template>
  <div class="app-container pallet-panel">
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="panel-heading">
          <div class="heading-main">
            <span class="heading-icon"
              ><el-icon><Setting /></el-icon
            ></span>
            <div>
              <h3 class="heading-title">指定栈板SN绑定</h3>
              <p class="heading-desc">选择产品后依次扫描栈板号与产品SN</p>
            </div>
          </div>
        </div>
      </template>
      <el-form :model="searchForm" label-position="top" class="work-form">
        <el-row :gutter="18" align="bottom">
          <el-col :xs="24" :sm="24" :md="12">
            <div class="form-field">
              <el-form-item label="选择产品">
                <ItemPalletPickField v-model="searchForm.item" @pick="handleItemPick" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :xs="24" :sm="16" :md="8">
            <div class="form-field">
              <el-form-item label="栈板每板数量">
                <div class="flex items-center gap-2 w-full">
                  <span v-if="!editPalletNumDisabled" class="pallet-num-text">{{ searchForm.palletNum }}</span>
                  <el-input-number v-else v-model="searchForm.palletNum" :min="0" controls-position="right" />
                  <el-button type="primary" plain class="ml-auto" @click="updatePalletNum">{{ editPalletNumDisabled ? '完成' : '修改' }}</el-button>
                </div>
              </el-form-item>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8" :md="4">
            <div class="form-field">
              <el-form-item label="已扫描SN">
                <div class="flex items-center w-full pallet-metric-line">
                  <span class="pallet-num-text">{{ dataSource.length }}</span>
                </div>
              </el-form-item>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <div class="compact-section-header">
        <div class="compact-section-title">
          <el-icon><Aim /></el-icon>
          <span>扫描栈板号与产品SN</span>
        </div>
        <span class="compact-section-desc">先校验栈板号，再连续扫描需要绑定的产品SN</span>
      </div>
      <el-row :gutter="18" align="middle">
        <el-col :xs="24" :sm="24" :md="10">
          <div class="scan-field">
            <el-form label-width="70px" class="work-form" @submit.prevent>
              <el-form-item label="栈板号">
                <el-input ref="palletNoInputRef" v-model="palletNo" placeholder="请扫描栈板号" clearable @keydown.tab.prevent="handlePalletNoScan" @keydown.enter.prevent="handlePalletNoScan" />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="10">
          <div class="scan-field">
            <el-form label-width="48px" class="work-form" @submit.prevent>
              <el-form-item label="SN">
                <el-input ref="snInputRef" v-model="scanSn" placeholder="请扫描SN" clearable @keydown.tab.prevent="handleSnScan" @keydown.enter.prevent="handleSnScan" />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="4">
          <div class="action-bar">
            <el-button v-if="dataSource.length > 0 && searchForm.palletNum > 0 && dataSource.length === searchForm.palletNum" type="primary" class="primary-action" @click="bindPalletSn"> 绑定栈板</el-button>
          </div>
        </el-col>
        <el-col v-if="resultMessage" :span="24">
          <div class="status-alert sn-status-alert">
            <el-alert show-icon closable :title="resultMessage" :type="resultStatus ? 'success' : 'error'" @close="clearScanResult">
              <template #icon>
                <Bell />
              </template>
            </el-alert>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="table-shell">
            <el-table :data="pagedDataSource" stripe row-key="sfc">
              <el-table-column prop="sequence" label="序号" width="80" align="center" sortable />
              <el-table-column prop="sfc" label="SN" min-width="200" align="center" show-overflow-tooltip />
              <el-table-column prop="snProductTime" label="生产时间" min-width="180" align="center" />
              <el-table-column label="操作" width="100" align="center" fixed="right">
                <template #default="{ row, $index }">
                  <el-button v-if="row.sfc" type="danger" link size="small" @click="delTableRecord(row, $index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-if="dataSource.length > pageSize" class="pagination-bar justify-end" layout="total, sizes, prev, pager, next" :total="dataSource.length" v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 30, 50, 100]" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup name="WorkPanelPalletSnBindWithNo" lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Aim, Bell, Setting } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { audioPlayer } from '@/utils/audioPlayer';
import { bindWorkPanelBoxSn, checkWorkPanelPalletNo, checkWorkPanelSn } from '@/api/mes/workpanel/pallet';
import type { WorkPanelItemPalletVO, WorkPanelPalletSnRow } from '@/api/mes/workpanel/pallet/types';
import ItemPalletPickField from '@/views/mes/workpanel/pallet/components/ItemPalletPickField.vue';

const isApiSuccess = (res: any) => res?.code === HttpStatus.SUCCESS || res?.success === true;

const resultMessage = ref('');
const resultStatus = ref(false);

const setResult = (message: string, success = false) => {
  resultMessage.value = message;
  resultStatus.value = success;
};

const clearScanResult = () => {
  resultMessage.value = '';
};

const getErrorMessage = (error: any, fallback: string) => error?.msg || error?.response?.data?.msg || fallback;

interface SearchForm {
  item?: string;
  palletNum: number;
}

const searchForm = reactive<SearchForm>({
  palletNum: 0
});

const result = reactive({
  palletNo: ''
});

const dataSource = ref<WorkPanelPalletSnRow[]>([]);
const editPalletNumDisabled = ref(false);
const palletNo = ref('');
const scanSn = ref('');
const palletNoInputRef = ref();
const snInputRef = ref();
const currentPage = ref(1);
const pageSize = ref(5);

const pagedDataSource = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return dataSource.value.slice(start, start + pageSize.value);
});

const handleItemPick = (row: WorkPanelItemPalletVO) => {
  if (row.palletNum != null) {
    searchForm.palletNum = Number(row.palletNum);
  }
};

const updatePalletNum = () => {
  editPalletNumDisabled.value = !editPalletNumDisabled.value;
};

const focusPalletNo = async () => {
  await nextTick();
  palletNoInputRef.value?.focus?.();
  palletNoInputRef.value?.select?.();
};

const focusSn = async () => {
  await nextTick();
  snInputRef.value?.focus?.();
  snInputRef.value?.select?.();
};

const handlePalletNoScan = async () => {
  await checkPalletNo();
};

const checkPalletNo = async () => {
  resultMessage.value = '';
  if (!searchForm.item) {
    setResult('请选择产品', false);
    audioPlayer.playWarning();
    return;
  }
  const no = palletNo.value?.trim();
  if (!no) {
    setResult('栈板号为空', false);
    audioPlayer.playWarning();
    return;
  }
  try {
    const res: any = await checkWorkPanelPalletNo({
      palletNo: no,
      item: searchForm.item
    });
    if (!isApiSuccess(res)) {
      throw res;
    }
    audioPlayer.playSuccess();
    await focusSn();
    dataSource.value = [];
  } catch (error: any) {
    await focusPalletNo();
    audioPlayer.playWarning();
    setResult(getErrorMessage(error, '栈板号校验失败'), false);
  }
};

const handleSnScan = async () => {
  await checkSnStatus();
};

const checkSnStatus = async () => {
  resultMessage.value = '';
  if (!searchForm.item) {
    setResult('请选择产品', false);
    audioPlayer.playWarning();
    return;
  }
  const no = palletNo.value?.trim();
  if (!no) {
    setResult('栈板号为空', false);
    audioPlayer.playWarning();
    return;
  }
  const sfc = scanSn.value?.trim();
  if (!sfc) {
    setResult('SN码为空', false);
    audioPlayer.playWarning();
    return;
  }
  const existIdx = dataSource.value.findIndex((item) => item.sfc === sfc);
  if (existIdx !== -1) {
    audioPlayer.playWarning();
    await focusSn();
    setResult(`条码${sfc}重复`, false);
    return;
  }
  try {
    const res: any = await checkWorkPanelSn({
      sfc,
      item: searchForm.item,
      useType: 1,
      palletSnList: dataSource.value
    });
    if (!isApiSuccess(res)) {
      throw res;
    }
    audioPlayer.playSuccess();
    const obj: WorkPanelPalletSnRow = {
      sfc,
      sequence: dataSource.value.length + 1,
      snProductTime: res.data?.actualCompDate
    };
    dataSource.value.push(obj);
    scanSn.value = '';
    await focusSn();
    if (searchForm.palletNum > 0 && obj.sequence === searchForm.palletNum) {
      await bindPalletSn();
    }
  } catch (error: any) {
    audioPlayer.playWarning();
    await focusSn();
    setResult(getErrorMessage(error, '条码状态校验异常'), false);
  }
};

const bindPalletSn = async () => {
  const req = {
    palletNo: palletNo.value?.trim(),
    useType: 1,
    item: searchForm.item,
    palletSnList: dataSource.value
  };
  try {
    const res: any = await bindWorkPanelBoxSn(req);
    if (!isApiSuccess(res)) {
      throw res;
    }
    const boundNo = res.data?.palletNo || req.palletNo;
    audioPlayer.playSuccess();
    setResult('栈板' + boundNo + '绑定成功', true);
    result.palletNo = boundNo || '';
    dataSource.value = [];
    palletNo.value = '';
    scanSn.value = '';
    await focusPalletNo();
  } catch (error: any) {
    audioPlayer.playWarning();
    setResult(getErrorMessage(error, '绑定失败'), false);
  }
};

const delTableRecord = (_record: WorkPanelPalletSnRow, index: number) => {
  const globalIndex = (currentPage.value - 1) * pageSize.value + index;
  const actualIndex = dataSource.value.length - 1 - globalIndex;
  dataSource.value.splice(actualIndex, 1);
  dataSource.value.forEach((row, i) => {
    row.sequence = i + 1;
  });
};

onMounted(() => {
  editPalletNumDisabled.value = false;
  focusPalletNo();
});
</script>

<style scoped lang="scss">
@use './pallet-workpanel' as workpanel;

@include workpanel.theme;

.pallet-num-text {
  color: #2274d7;
  font-size: 24px;
  font-weight: 700;
  line-height: 34px;
}
</style>
