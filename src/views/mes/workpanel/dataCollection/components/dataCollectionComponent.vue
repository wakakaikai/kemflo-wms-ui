<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as services from '@/api/mes/workpanel';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { AssembleForm, AssembleQuery } from '@/api/mes/workpanel/assemble/types';
import { HttpStatus } from '@/enums/RespEnum';

import ReplaceComponentDialog from '@/views/mes/workpanel/assemble/components/replaceComponentDialog.vue';
const replaceComponentDialogDialogRef = ref<InstanceType<typeof ReplaceComponentDialog>>();
const props = defineProps<{
  podConfig: Record<string, any>;
}>();

const emit = defineEmits(['close']);

const initFormData: AssembleForm = {
  sfc: '',
  steps: [],
  stepActive: 0,
  stepName: '',
  bomComponentVo: {},
  bomComponentVoList: [],
  canAssembleComponents: false
};
const data = reactive<PageData<AssembleForm, AssembleQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sfc: '',
    steps: [],
    stepActive: 0,
    stepName: '',
    bomComponentVo: {},
    bomComponentVoList: [],
    canAssembleComponents: false
  },
  rules: {
    sfc: [{ required: true, message: '产品条码不能为空' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const loading = ref(false);
const sfcInputRef = ref<HTMLInputElement | null>(null);
const inputRefs = ref<HTMLInputElement[]>([]);
const rowRecord = ref<any>({});
const modalVisibleReplace = ref(false);
const modalVisibleDisassemble = ref(false);
const disassemblyLoading = ref(false);

const replaceInventoryIdRef = ref();
const assembleInfo = ref<{ [key: string]: any }>({});

const querySfcProcessList = async () => {
  const res: any = await services.querySfcProcessList({
    sfc: form.value.sfc
  });
  form.value.steps = res.data;
  const index = res.data.findIndex((item: any) => {
    return parseInt(item.qtyInQueue) === 1;
  });
  form.value.stepActive = index;
  form.value.stepName = res.data[index];
};

const querySfcBomComponentList = async () => {
  const res: any = await services.querySfcBomComponentList({
    sfc: form.value?.sfc,
    operation: props.podConfig?.operation,
    resource: props?.podConfig.resource,
    activityId: ''
  });
  if (res.code == HttpStatus.SUCCESS) {
    if (res.data.length !== 0) {
      form.value.bomComponentVoList = res.data?.map((item: any, index: any) => ({
        ...item,
        [`bomItemSfc${index}`]: item.bomItemSfc,
        validateStatus: '',
        validateMsg: ''
      }));

      await nextTick(() => {
        if (sfcInputRef.value) {
          sfcInputRef.value.focus();
          sfcInputRef.value.select();
        }
        for (let i = 0; i < res.data.length; i++) {
          if (!res.data[i].bomItemSfc && inputRefs.value[i]) {
            inputRefs.value[i].focus();
            inputRefs.value[i].select();
            form.value.canAssembleComponents = true;
            break;
          }
        }
      });
    } else {
      proxy?.$modal.msgError(res.msg || '待装配列表为空，请检查工序是否正确或联系IE检查关键件BOM。');
    }
  }
};

const querySfcQueueInfo = async () => {
  assembleInfo.value = {};
  form.value.bomComponentVoList = [];
  form.value.steps = [];
  const res: any = await services.querySfcQueueInfo({
    sfc: form.value.sfc
  });
  assembleInfo.value = res.data || {};
};

const querySfcInfo = async () => {
  try {
    loading.value = true;
    await Promise.all([querySfcQueueInfo(), querySfcProcessList(), querySfcBomComponentList()]);
  } finally {
    loading.value = false;
  }
};

const saveSfcBomComponents = async () => {
  loading.value = true;
  const bomComponentList = form.value.bomComponentVoList?.map((item: any, index: any) => ({
    ...item,
    bomItemSfc: (form.value.bomComponentVoList || [])[index][`bomItemSfc${index}`]
  }));

  const res: any = await services
    .saveSfcBomComponent({
      sfc: form.value?.sfc,
      operation: props.podConfig?.operation,
      activityId: '',
      resource: props?.podConfig.resource,
      assembleComponentVoList: bomComponentList
    })
    .finally(() => (loading.value = false));
  if (res.data?.passResult) {
    await nextTick(() => {
      querySfcInfo();
      if (sfcInputRef.value) {
        sfcInputRef.value.focus();
        sfcInputRef.value.select();
      }
    });
  } else if (!res.data?.passResult) {
    const tableData = form.value?.bomComponentVoList || [];
    for (const i in tableData) {
      if (tableData[i].id === res.data.id) {
        tableData[i].validateMsg = res.data.validateMsg;
        tableData[i].validateStatus = res.data.validateStatus;
        if (inputRefs.value[i]) {
          inputRefs.value[i].focus();
          inputRefs.value[i].select();
        }
      }
    }
  }
};

const onReplace = (record: any) => {
  rowRecord.value = record;
  rowRecord.value.sfc = form.value.sfc;
  replaceComponentDialogDialogRef.value.openDialog({
    podConfig: props.podConfig,
    rowRecord: rowRecord.value
  });
};

const replaceComponentCallBack = (record: any) => {
  querySfcInfo();
};

const onDisassemble = (record: any) => {
  // publicRecord.component = record.component;
  // publicRecord.componentAndRevision = `${record.component}/${record.componentRevision}`;
  // publicRecord.componentDesc = record.componentDesc;
  // publicRecord.componentRevision = record.componentRevision;
  // publicRecord.inventoryId = record.bomItemSfc;
  // publicRecord.inventoryRef = record.inventoryRef;
  // publicRecord.sfcAssyRef = record.sfcAssyRef;
  // publicRecord.operation = record.operation;
  modalVisibleDisassemble.value = true;
};

const handlModalOK = async () => {
  disassemblyLoading.value = true;
  const params = {
    operation: props.podConfig?.podConfigVO?.defaultOperation,
    resource: props.podConfig?.podConfigVO?.defaultResource,
    sfc: form.value.sfc,
    sfcAssyRef: rowRecord.value.sfcAssyRef
  };
  const res: any = await services.disassemblyComponent(params);
  disassemblyLoading.value = false;
  if (!res.success) {
    ElMessage.warning(res.msg || res.message || '拆解失败');
    return;
  }
  modalVisibleDisassemble.value = false;
  await querySfcBomComponentList();
};

const handleModalCancel = () => {
  modalVisibleDisassemble.value = false;
};

const handleReplaceModalCancel = () => {
  replaceInventoryIdRef?.value.reSetValue();
  modalVisibleReplace.value = false;
};

const keyDownTab = async () => {
  form.value.sfc = form.value.sfc.trim();
  await querySfcInfo();
};

const validateSfc = (value: any): { validateStatus: string; validateMsg: string } => {
  if (value) {
    value = value.replace(/\s/g, '');
    if (value.length > 0) {
      return {
        validateStatus: 'success',
        validateMsg: ''
      };
    }
  }
  return {
    validateStatus: 'error',
    validateMsg: '组件条码不能为空'
  };
};

const setInputRef = (el: any, index: any) => {
  inputRefs.value[index] = el;
};

const handleChange = async (record: any, index: number) => {
  const sfc = record[`bomItemSfc${index}`];
  let { validateMsg, validateStatus } = validateSfc(sfc);
  if (checkRepeat(sfc)) {
    validateMsg = `条码:${sfc}扫码内容重复`;
    validateStatus = 'error';
    return callbackValidate(validateMsg, validateStatus, record);
  }
  if (sfc.length !== record.itemSfcLength) {
    validateMsg = `条码:${sfc}长度:${sfc.length}与设置的长度:${record.itemSfcLength}不匹配`;
    validateStatus = 'error';
    return callbackValidate(validateMsg, validateStatus, record);
  }
  if (record.sfcItemRule) {
    const regex = new RegExp(record.sfcItemRule);
    if (!regex.test(sfc)) {
      validateMsg = `条码:${sfc} 与设置的物料规则:${record.sfcItemRule}不匹配`;
      validateStatus = 'error';
      return callbackValidate(validateMsg, validateStatus, record);
    }
  } else if (record.sfcItemGroupRule) {
    const regex = new RegExp(record.sfcItemGroupRule);
    if (!regex.test(sfc)) {
      validateMsg = `条码:${sfc} 与设置的物料组规则:${record.sfcItemGroupRule}不匹配`;
      validateStatus = 'error';
      return callbackValidate(validateMsg, validateStatus, record);
    }
  }
  return validateStatus;
};

const callbackValidate = (validateMsg: any, validateStatus: any, record: any) => {
  (form.value?.bomComponentVoList || []).forEach((val: any) => {
    if (val.id === record.id) {
      val.validateMsg = validateMsg;
      val.validateStatus = validateStatus;
    }
  });
  return validateStatus;
};

const checkRepeat = (content: any) => {
  const regex = /^(.+)\1+$/;
  return regex.test(content);
};

const keyDownTableTab = async (record: any, index: any) => {
  const validateResult = await handleChange(record, index);
  if (validateResult == 'error') return;

  loading.value = true;
  const bomComponentList = [
    {
      ...record,
      bomItemSfc: (form.value.bomComponentVoList || [])[index][`bomItemSfc${index}`]
    }
  ];
  const res: any = await services
    .validateSfcBomComponent({
      sfc: form.value?.sfc,
      operation: props.podConfig?.operation,
      activityId: '',
      resource: props.podConfig?.resource,
      assembleComponentVoList: bomComponentList
    })
    .finally(() => (loading.value = false));
  if (res.data.validateStatus == 'success') {
    record.validateStatus = '';
    record.validateMsg = '';
    await nextTick(() => {
      if (sfcInputRef.value) {
        sfcInputRef.value.focus();
        sfcInputRef.value.select();
      }
    });
  } else {
    const tableData = form.value?.bomComponentVoList || [];
    for (const i in tableData) {
      if (tableData[i].id === res.data.id) {
        tableData[i].validateMsg = res.data.validateMsg;
        tableData[i].validateStatus = res.data.validateStatus;
        if (inputRefs.value[i]) {
          inputRefs.value[i].focus();
          inputRefs.value[i].select();
        }
        return;
      }
    }
  }

  let existNotSfcComponent = false;
  let existErrorSfcComponent = false;
  await nextTick(() => {
    if (index < inputRefs.value.length - 1) {
      for (let i = index + 1; i < inputRefs.value.length; i++) {
        if (!record[`bomItemSfc${i}`] && inputRefs.value[i]) {
          existNotSfcComponent = true;
          inputRefs.value[i].focus();
          inputRefs.value[i].select();
          break;
        }
      }
    }
    for (const item of form.value?.bomComponentVoList || []) {
      if (item.validateMsg) {
        existErrorSfcComponent = true;
        break;
      }
    }
    if (form.value.sfc && !existNotSfcComponent && form.value.canAssembleComponents && !existErrorSfcComponent) {
      saveSfcBomComponents();
    }
  });
};

onMounted(async () => {});
defineExpose({});
</script>

<template>
  <el-card>
    <el-form ref="queryFormRef" :model="form" :rules="rules" label-width="auto" :inline="true">
      <el-row :gutter="24">
        <el-col :lg="8" :md="8" :sm="12">
          <el-form-item label="产品条码" prop="sfc" style="display: flex; width: 100%">
            <el-input ref="sfcInputRef" v-model="form.sfc" placeholder="请输入产品条码" clearable @keydown.tab.prevent="keyDownTab" @keydown.enter.prevent="keyDownTab" style="flex: 1" />
          </el-form-item>
        </el-col>
        <el-col :lg="4" :md="4" :sm="4">
          <el-form-item label="工单号:" prop="shopOrder">
            <el-button class="dashed-blue-btn min-w-[120px]" size="small">
              {{ assembleInfo.shopOrder || '' }}
            </el-button>
          </el-form-item>
        </el-col>
        <el-col :lg="4" :md="4" :sm="4">
          <el-form-item label="产品料号:" prop="shopOrder">
            <el-button class="dashed-blue-btn min-w-[120px]" size="small">
              {{ assembleInfo.item || '' }}
            </el-button>
          </el-form-item>
        </el-col>
        <el-col :lg="8" :md="8" :sm="8">
          <el-form-item label="产品描述:" prop="shopOrder">
            <el-button class="dashed-blue-btn min-w-[150px]" size="small">
              {{ assembleInfo.itemDesc || '' }}
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-steps :active="form.stepActive" finish-status="success">
      <el-step v-for="item in form.steps" :key="item.stepId" :title="item.operation" :description="item.operationDesc" />
    </el-steps>

    <el-table v-loading="loading" :data="form.bomComponentVoList" row-key="id" border highlight-current-row :row-class-name="({ row }) => (row.validateMsg ? 'error-row' : '')">
      <template #empty>
        <el-empty description="暂无数据" />
      </template>
      <el-table-column prop="sequence" label="顺序" width="60" align="center" />
      <el-table-column prop="bomItem" label="组件" width="140" align="center" />
      <el-table-column prop="bomItemDesc" label="描述" min-width="200" align="center" />
      <el-table-column prop="assembleOperation" label="工序" width="100" align="center" />
      <el-table-column prop="itemNeedValid" label="校验规则" width="110" align="center">
        <template #default="{ row }">
          {{ row.itemNeedValid }}
        </template>
      </el-table-column>
      <el-table-column prop="itemSfcLength" label="条码位数" width="80" align="center" />
      <el-table-column prop="sfcItemRule" label="物料正则" width="150" align="center" />
      <el-table-column prop="bomItemSfc" label="组件条码" min-width="300" align="center">
        <template #default="{ row, $index }">
          <div class="table-cell-wrapper">
            <el-form-item
              :prop="`bomItemSfc${$index}`"
              :error="row.validateMsg"
              :class="['dynamic-error-item', { 'has-error': !!row.validateMsg }]"
              :style="{ '--error-height': row.validateMsg ? `${Math.ceil(row.validateMsg.length / 30) * 15}px` : '0' }"
            >
              <el-input
                :ref="(el) => setInputRef(el, $index)"
                v-model="row[`bomItemSfc${$index}`]"
                :disabled="!!row.bomItemSfc"
                autocomplete="off"
                @keydown.tab.prevent="keyDownTableTab(row, $index)"
                @keydown.enter.prevent="keyDownTableTab(row, $index)"
              />
            </el-form-item>
          </div>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button v-if="row.bomItemSfc" type="danger" size="small" @click="onReplace(row)"> 替换 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="modalVisibleDisassemble" title="拆解" width="80%" :close-on-click-modal="false" @close="handleModalCancel">
      <el-skeleton :spinning="disassemblyLoading">
        <div style="text-align: center">
          组件条码：{{ publicRecord.inventoryId }}, 物料：{{ `${publicRecord.componentAndRevision}` }}
          <div>{{ ` ${publicRecord.componentDesc}` }}</div>
        </div>

        <template #footer>
          <el-button @click="handleModalCancel">取消</el-button>
          <el-button type="primary" @click="handlModalOK">确定</el-button>
        </template>
      </el-skeleton>
    </el-dialog>

    <ReplaceComponentDialog ref="replaceComponentDialogDialogRef" @replace-component-call-back="replaceComponentCallBack" />
  </el-card>
</template>

<style scoped>
.dashed-blue-btn {
  border: 1px dashed #3b82f6 !important;
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
}

.dashed-blue-btn:hover {
  border-color: #2563eb !important;
  color: #2563eb !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
}

.dynamic-error-item {
  position: relative;
  margin-bottom: var(--error-height, 0);
  transition: margin-bottom 0.2s;
}

.dynamic-error-item .el-form-item__error {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  font-size: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
  box-sizing: border-box;
  background: #fff;
  z-index: 10;
}
</style>
