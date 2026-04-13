<template>
  <div class="app-container">
    <!-- 操作说明卡片 -->
    <!--
    <el-card class="instruction-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>📋 操作说明</span>
        </div>
      </template>
      <div class="instruction-content">
        <p>1. 此岗位验证已装箱堆码栈板SN/中箱码</p>
        <p>2. 先在栈板号输入框中扫描栈板号展示系统装箱数据</p>
        <p>3. 若SN和生产时间标记为红色,表示生产日期未通过校验,该栈板不可验证SN不可出货</p>
        <p>4. 在SN/中箱码输入框中扫描,若存在则背景为蓝色</p>
      </div>
    </el-card>
-->

    <!-- 扫描验证区域 -->
    <el-card class="scan-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>验证出货线板SN</span>
          <div v-if="resultMessage" class="m-y-2">
            <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
              <template #icon>
                <Bell />
              </template>
            </el-alert>
          </div>
        </div>
      </template>
      <el-form :model="queryParams" label-width="auto" class="scan-form" inline>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="栈板号">
              <el-input ref="palletNoRef" v-model.trim="queryParams.palletNo" placeholder="请输入栈板号" @keyup.enter="handlePalletNoScan" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="SN">
              <el-input ref="snRef" v-model.trim="scanSn" placeholder="请扫描SN" clearable @keyup.enter="handleSnScan"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8"> </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="设定验证数量">
              <el-input-number v-model="total" :precision="0" disabled style="width: 120px" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="验证符合数量">
              <el-input-number v-model="verifyTotal" disabled style="width: 120px" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table :data="palletSnList" border stripe style="width: 100%" v-loading="loading" :row-class-name="tableRowClassName">
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
    </el-card>
  </div>
</template>

<script setup name="miPalletVerify" lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import { addPalletSn, listPalletSn } from '@/api/mes/palletSn';
import { PalletSnVO, PalletSnQuery, PalletSnForm } from '@/api/mes/palletSn/types';
import { audioPlayer } from '@/utils/audioPlayer';
import { Bell } from '@element-plus/icons-vue';
import { addPalletSnCheck } from '@/api/mes/palletSnCheck';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const palletSnList = ref<PalletSnVO[]>([]);
const loading = ref(false);
const total = ref(0);
const scanSn = ref('');

const initFormData: PalletSnForm = {
  id: undefined,
  palletNo: undefined,
  sequence: undefined,
  sfc: undefined
};
const data = reactive<PageData<PalletSnForm, PalletSnQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 2000,
    palletNo: '',
    sequence: undefined,
    sfc: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const queryFormRef = ref<ElFormInstance>();
const palletNoRef = ref<ElFormInstance>();
const snRef = ref<ElFormInstance>();
const resultMessage = ref('');
const resultStatus = ref(false);

/**
 * 栈板号扫码
 */
const handlePalletNoScan = async () => {
  if (queryParams.value.palletNo) {
    try {
      resultMessage.value = '';
      loading.value = true;
      const res = await listPalletSn(queryParams.value);
      palletSnList.value = res.rows;
      if (!palletSnList.value.length) {
        resultMessage.value = `栈板号${queryParams.value.palletNo}绑定记录不存在`;
        resultStatus.value = false;
        audioPlayer.playWarning();
        return;
      }
      total.value = res.total;

      await nextTick(() => {
        if (snRef.value) {
          audioPlayer.playSuccess();
          snRef.value.focus();
          snRef.value.select();
        }
      });
    } finally {
      loading.value = false;
    }
  }
};

/**
 * SN扫码
 */
const handleSnScan = async () => {
  resultMessage.value = '';
  if (!scanSn.value) {
    resultMessage.value = `请输入SN码`;
    resultStatus.value = false;
    audioPlayer.playWarning();
    return;
  }

  const matchedIndex = palletSnList.value.findIndex((item) => item.sfc === scanSn.value);
  if (matchedIndex !== -1) {
    palletSnList.value[matchedIndex].verifyResult = true;
    audioPlayer.playSuccess();
  } else {
    resultMessage.value = `SN码${scanSn.value}不在列表中`;
    resultStatus.value = false;
    audioPlayer.playWarning();
  }
  scanSn.value = '';
  // 如果列表全部验证通过
  if (palletSnList.value.every((item) => item.verifyResult === true)) {
    await addPalletSnCheck({
      palletNo: queryParams.value.palletNo,
      checkQuantity: palletSnList.value.length
    });
    resultMessage.value = `栈板${queryParams.value.palletNo}验证通过`;
    resultStatus.value = true;
    if (palletNoRef.value) {
      palletSnList.value = [];
      queryParams.value.palletNo = '';
      palletNoRef.value.focus();
      palletNoRef.value.select();
    }
  }
};

const tableRowClassName = ({ row, rowIndex }) => {
  if (row.verifyResult) {
    return 'verified-row';
  }
  return '';
};

const verifyTotal = computed(() => {
  return palletSnList.value.filter((item) => item.verifyResult === true).length;
});
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 验证通过行蓝色背景 */
:deep(.el-table__body tr.verified-row) {
  background-color: #2fb6f3 !important;
  color: #fff;
}

:deep(.el-table__body tr.verified-row td) {
  background-color: #2fb6f3 !important;
}

.verified-row:hover td {
  background-color: #bae7ff !important;
}
</style>
