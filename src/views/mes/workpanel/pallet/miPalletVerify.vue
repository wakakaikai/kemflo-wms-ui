<template>
  <div class="app-container pallet-panel">
    <el-card class="panel-card" shadow="never">
      <template #header>
        <div class="panel-heading">
          <div class="heading-main">
            <span class="heading-icon verify-icon"
              ><el-icon><CircleCheck /></el-icon
            ></span>
            <div>
              <h3 class="heading-title">小米栈板SN出货验证</h3>
              <p class="heading-desc">先扫描栈板号加载绑定明细，再逐一扫描SN完成出货核验</p>
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
      <el-alert class="hint-alert" title="扫描提示" description="验证通过的SN将在下方列表中高亮；全部SN验证完成后系统自动提交核验结果。" type="info" show-icon :closable="false" />
      <el-form :model="queryParams" label-width="70px" class="work-form scan-form">
        <el-row :gutter="18">
          <el-col :xs="24" :sm="24" :md="12">
            <div class="scan-field">
              <el-form-item label="栈板号">
                <el-input ref="palletNoRef" v-model.trim="queryParams.palletNo" class="w-full" placeholder="请输入或扫描栈板号" clearable @keyup.enter="handlePalletNoScan" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <div class="scan-field">
              <el-form-item label="SN">
                <el-input ref="snRef" v-model.trim="scanSn" class="w-full" placeholder="请扫描SN" clearable @keyup.enter="handleSnScan" />
              </el-form-item>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="18" class="count-row">
          <el-col :xs="24" :sm="8">
            <div class="metric-card">
              <div>
                <div class="metric-label">待验证数量</div>
                <div class="metric-value">{{ total }}</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="metric-card success-metric">
              <div>
                <div class="metric-label">验证通过</div>
                <div class="metric-value">{{ verifyTotal }}</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="metric-card pending-metric">
              <div>
                <div class="metric-label">剩余数量</div>
                <div class="metric-value">{{ Math.max(total - verifyTotal, 0) }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <div class="table-shell">
        <el-table :data="palletSnList" stripe style="width: 100%" v-loading="loading" :row-class-name="tableRowClassName" empty-text="请先扫描栈板号加载SN明细">
          <el-table-column prop="sequence" label="序号" width="70" align="center" />
          <el-table-column prop="palletNo" label="栈板号" min-width="200" show-overflow-tooltip />
          <el-table-column prop="sfc" label="SN" min-width="220" show-overflow-tooltip />
          <!--        <el-table-column prop="produceTime" label="生产时间" width="180">
          <template #default="{ row }">
            <span :class="{ 'red-text': row.isTimeInvalid }">{{ row.produceTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="packTime" label="装箱时间" width="180" />-->
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup name="miPalletVerify" lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import type { InputInstance } from 'element-plus';
import { listPalletSn } from '@/api/mes/palletSn';
import { PalletSnQuery, PalletSnVO } from '@/api/mes/palletSn/types';
import { audioPlayer } from '@/utils/audioPlayer';
import { Bell, CircleCheck } from '@element-plus/icons-vue';
import { addPalletSnCheck } from '@/api/mes/palletSnCheck';

type PalletSnVerifyRow = PalletSnVO & { verifyResult?: boolean };

const palletSnList = ref<PalletSnVerifyRow[]>([]);
const loading = ref(false);
const total = ref(0);
const scanSn = ref('');

const queryParams = reactive<PalletSnQuery>({
  pageNum: 1,
  pageSize: 2000,
  palletNo: '',
  sequence: undefined,
  sfc: undefined,
  params: {}
});

const palletNoRef = ref<InputInstance>();
const snRef = ref<InputInstance>();
const resultMessage = ref('');
const resultStatus = ref(false);

const setResult = (message: string, success = false) => {
  resultMessage.value = message;
  resultStatus.value = success;
};

const getErrorMessage = (error: any, fallback: string) => error?.msg || error?.response?.data?.msg || fallback;

const resetScanState = () => {
  palletSnList.value = [];
  total.value = 0;
};

/**
 * 栈板号扫码
 */
const handlePalletNoScan = async () => {
  const palletNo = queryParams.palletNo?.trim();
  if (!palletNo) {
    setResult('请输入或扫描栈板号', false);
    audioPlayer.playWarning();
    return;
  }
  queryParams.palletNo = palletNo;
  try {
    resultMessage.value = '';
    loading.value = true;
    const res = await listPalletSn(queryParams, true);
    palletSnList.value = (res.rows || []) as PalletSnVerifyRow[];
    if (!palletSnList.value.length) {
      resetScanState();
      setResult(`栈板号${palletNo}绑定记录不存在`, false);
      audioPlayer.playWarning();
      return;
    }
    total.value = res.total ?? palletSnList.value.length;

    await nextTick();
    audioPlayer.playSuccess();
    snRef.value?.focus?.();
    snRef.value?.select?.();
  } catch (error: any) {
    resetScanState();
    setResult(getErrorMessage(error, '查询栈板SN失败'), false);
    audioPlayer.playWarning();
  } finally {
    loading.value = false;
  }
};

/**
 * SN扫码
 */
const handleSnScan = async () => {
  resultMessage.value = '';
  if (!palletSnList.value.length) {
    setResult('请先扫描栈板号加载SN明细', false);
    audioPlayer.playWarning();
    return;
  }
  const sn = scanSn.value?.trim();
  if (!sn) {
    setResult('请输入SN码', false);
    audioPlayer.playWarning();
    return;
  }

  const matchedIndex = palletSnList.value.findIndex((item) => item.sfc === sn);
  if (matchedIndex !== -1) {
    palletSnList.value[matchedIndex].verifyResult = true;
    audioPlayer.playSuccess();
  } else {
    setResult(`SN码${sn}不在列表中`, false);
    audioPlayer.playWarning();
  }
  scanSn.value = '';
  // 如果列表全部验证通过
  if (palletSnList.value.length > 0 && palletSnList.value.every((item) => item.verifyResult === true)) {
    const palletNo = queryParams.palletNo;
    try {
      await addPalletSnCheck(
        {
          palletNo,
          checkQuantity: palletSnList.value.length
        },
        true
      );
    } catch (error: any) {
      setResult(getErrorMessage(error, '提交栈板验证结果失败'), false);
      audioPlayer.playWarning();
      return;
    }
    setResult(`栈板${palletNo}验证通过`, true);
    resetScanState();
    queryParams.palletNo = '';
    await nextTick();
    palletNoRef.value?.focus?.();
    palletNoRef.value?.select?.();
  }
};

const tableRowClassName = ({ row }: { row: PalletSnVerifyRow }) => {
  return row.verifyResult ? 'verified-row' : '';
};

const verifyTotal = computed(() => {
  return palletSnList.value.filter((item) => item.verifyResult === true).length;
});
</script>

<style scoped lang="scss">
@use './pallet-workpanel' as workpanel;

@include workpanel.theme;

.scan-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.count-row {
  margin-top: 4px;
}

.success-metric .metric-value {
  color: var(--el-color-success);
}

.pending-metric .metric-value {
  color: var(--el-color-warning);
}

:deep(.el-table__body tr.verified-row) {
  color: var(--el-color-primary);
  font-weight: 600;
}

:deep(.el-table__body tr.verified-row td) {
  background-color: var(--el-color-primary-light-9) !important;
}

:deep(.el-table__body tr.verified-row:hover td) {
  background-color: var(--el-color-primary-light-8) !important;
}
</style>
