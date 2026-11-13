<template>
  <div class="app-container pallet-panel">
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="panel-heading">
          <div class="heading-main">
            <span class="heading-icon unbind-icon"
              ><el-icon><Unlock /></el-icon
            ></span>
            <div>
              <h3 class="heading-title">栈板SN解绑</h3>
              <p class="heading-desc">可按栈板号或SN查询，支持单条解绑与整板解绑</p>
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
      <div class="section-label">查询条件</div>
      <el-row :gutter="18" align="middle">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="scan-field">
            <el-form label-width="70px" class="work-form" @submit.prevent>
              <el-form-item label="栈板号">
                <el-input ref="palletNoInputRef" v-model="palletNo" placeholder="请输入或扫描栈板号" clearable @keydown.enter.prevent="() => queryPalletSn()" />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="scan-field">
            <el-form label-width="42px" class="work-form" @submit.prevent>
              <el-form-item label="SN">
                <el-input ref="sfcInputRef" v-model="sfc" placeholder="请输入或扫描产品SN" clearable @keydown.enter.prevent="() => queryPalletSn()" />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <div class="action-bar query-actions">
            <el-button type="primary" @click="() => queryPalletSn()">查询</el-button>
            <el-button type="danger" @click="openUnbindDialog">解绑栈板</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="table-shell">
            <el-table :data="pagedDataSource" stripe row-key="sfc">
              <el-table-column prop="palletNo" label="栈板码" min-width="160" align="center" show-overflow-tooltip />
              <el-table-column prop="sfc" label="SN" min-width="200" align="center" show-overflow-tooltip />
              <el-table-column prop="modifyTime" label="绑定时间" min-width="180" align="center" />
              <el-table-column label="操作" width="100" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="row.sfc" type="danger" link size="small" @click="delTableRecord(row)">解绑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-if="dataSource.length > pageSize" class="pagination-bar justify-end" layout="total, sizes, prev, pager, next" :total="dataSource.length" v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 30, 50, 100]" />
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="open" title="解绑栈板SN" width="420px" :close-on-click-modal="false" @close="open = false">
      <div class="confirm-content">
        确定解绑栈板 <strong>{{ confirmPalletNo }}</strong> 绑定的全部SN条码吗？
      </div>
      <template #footer>
        <el-button @click="open = false">取消</el-button>
        <el-button type="primary" @click="handleUnbindPalletSn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="WorkPanelPalletSnUnbind" lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Bell, Unlock } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listWorkPanelPalletSn, unbindWorkPanelPalletSn } from '@/api/mes/workpanel/pallet';
import type { WorkPanelPalletSnRow } from '@/api/mes/workpanel/pallet/types';

const isApiSuccess = (res: any) => res?.code === HttpStatus.SUCCESS || res?.success === true;

const resultMessage = ref('');
const resultStatus = ref(false);

const setResult = (message: string, success = false) => {
  resultMessage.value = message;
  resultStatus.value = success;
};

const getErrorMessage = (error: any, fallback: string) => error?.msg || error?.response?.data?.msg || fallback;

const dataSource = ref<WorkPanelPalletSnRow[]>([]);
const palletNo = ref('');
const sfc = ref('');
const open = ref(false);
const confirmPalletNo = ref('');
const palletNoInputRef = ref();
const sfcInputRef = ref();
const currentPage = ref(1);
const pageSize = ref(10);

const pagedDataSource = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return dataSource.value.slice(start, start + pageSize.value);
});

const adjustPageAfterRemove = () => {
  const maxPage = Math.max(1, Math.ceil(dataSource.value.length / pageSize.value));
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }
};

const queryPalletSn = async (options?: { keepResult?: boolean }) => {
  if (!options?.keepResult) {
    resultMessage.value = '';
  }
  const palletNoVal = palletNo.value?.trim();
  const sfcVal = sfc.value?.trim();
  if (!palletNoVal && !sfcVal) {
    return;
  }
  try {
    const res: any = await listWorkPanelPalletSn({
      palletNo: palletNoVal,
      sfc: sfcVal
    });
    if (!isApiSuccess(res)) {
      throw res;
    }
    dataSource.value = res.data || [];
    if (dataSource.value.length > 0 && dataSource.value[0].palletNo) {
      palletNo.value = dataSource.value[0].palletNo;
    }
  } catch (error: any) {
    dataSource.value = [];
    setResult(getErrorMessage(error, '查询失败'), false);
  }
};

const openUnbindDialog = () => {
  const targetPalletNo = palletNo.value?.trim() || dataSource.value[0]?.palletNo?.trim();
  if (!targetPalletNo) {
    setResult('请先查询需要解绑的栈板', false);
    return;
  }
  confirmPalletNo.value = targetPalletNo;
  open.value = true;
};

const resetForm = async () => {
  palletNo.value = '';
  sfc.value = '';
  dataSource.value = [];
  await nextTick();
  palletNoInputRef.value?.focus?.();
};

const handleReset = async () => {
  resultMessage.value = '';
  await resetForm();
};

const handleUnbindPalletSn = async () => {
  open.value = false;
  await unBindPalletSn();
};

const unBindPalletSn = async () => {
  const targetPalletNo = confirmPalletNo.value?.trim();
  const req = {
    // 整板解绑不能传入搜索使用的 SN；后端收到 sfc 时只会解绑该单条记录。
    palletNo: targetPalletNo
  };
  try {
    const res: any = await unbindWorkPanelPalletSn(req);
    if (!isApiSuccess(res)) {
      throw res;
    }
    setResult('栈板' + targetPalletNo + '绑定的全部SN解绑成功', true);
    await resetForm();
  } catch (error: any) {
    setResult(getErrorMessage(error, '解绑失败'), false);
  }
};

const delTableRecord = async (record: WorkPanelPalletSnRow) => {
  const targetPalletNo = record.palletNo || palletNo.value?.trim();
  try {
    const res: any = await unbindWorkPanelPalletSn({
      palletNo: targetPalletNo,
      sfc: record.sfc
    });
    if (!isApiSuccess(res)) {
      throw res;
    }
    setResult(`SN ${record.sfc} 解绑成功`, true);
    if (targetPalletNo) {
      palletNo.value = targetPalletNo;
      sfc.value = '';
      await queryPalletSn({ keepResult: true });
    } else {
      dataSource.value = dataSource.value.filter((item) => item.sfc !== record.sfc);
      adjustPageAfterRemove();
    }
  } catch (error: any) {
    setResult(getErrorMessage(error, '解绑失败'), false);
  }
};

onMounted(() => {
  palletNoInputRef.value?.focus?.();
});
</script>

<style scoped lang="scss">
@use './pallet-workpanel' as workpanel;

@include workpanel.theme;

.unbind-icon {
  background: linear-gradient(135deg, #f56c6c, #db4c4c);
  box-shadow: 0 6px 14px rgb(245 108 108 / 22%);
}

.query-actions {
  justify-content: flex-start;
}
</style>
