<!--
 * @Descripttion: 数据收集-布尔类型使用输入框
 * @version:
 * @Author: Kevin
 * @Date: 2025-06-06 09:46:10
 * @LastEditors: Kevin
 * @LastEditTime: 2025-06-06 09:46:10
-->
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { FullScreen, Search } from '@element-plus/icons-vue';
import * as services from '@/api/mes/workpanel';
import useDialog from '@/hooks/useDialog';
import { queryDataCollectionBySfc } from '@/api/mes/workpanel';

interface FormData {
  sfc: string;
}

interface DcDetail {
  id: number;
  dcGroupRef?: string;
  dcGroup?: string;
  dcGroupRevision?: string;
  firstDescription?: string;
  dcGroupAndRevision?: string;
  contentRule?: string;
  dcParameter?: string;
  description?: string;
  dataType?: string;
  dataTypeDesc?: string;
  booleanTrueValue?: string;
  booleanFalseValue?: string;
  minValue?: number | string;
  maxValue?: number | string;
  units?: string;
  actualVal?: string;
  remark?: string;
  required?: boolean;
  validateStatus?: string;
  errorMsg?: string;
  extFieldsVOList?: Array<{ fieldName: string; value: string }>;
  [key: string]: any;
}

const props = defineProps({
  podConfig: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close']);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [5, 10, 15, 20, 30]
});

const handleTableChange = (val: number) => {
  pagination.current = val;
};

const isFullscreen = ref(false);
const inputRefs = ref<HTMLInputElement[]>([]);
const setInputRef = (el: HTMLInputElement, index: number) => {
  if (el) {
    inputRefs.value[index] = el;
  }
};

const formData = reactive<FormData>({
  sfc: ''
});

const loading = ref(false);
const dataSource = ref<DcDetail[]>([]);
const sfcRef = ref<HTMLInputElement | null>(null);
const itemRef = ref('');
const itemGroupRef = ref('');
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '数据收集'
});

const getDataTypeDesc = (record: DcDetail) => {
  // 布尔类型 (B)
  if (record.dataType === 'B') {
    return `${record.dataTypeDesc} (${record.booleanTrueValue}/${record.booleanFalseValue})`;
  }
  // 数字类型 (N)
  else if (record.dataType === 'N') {
    // 更精确的有效数字检测
    const isValidNumber = (value: any) => value !== null && value !== undefined && value !== '' && !isNaN(Number(value));

    const hasMin = isValidNumber(record.minValue);
    const hasMax = isValidNumber(record.maxValue);

    return hasMin || hasMax ? `${record.dataTypeDesc} (${hasMin ? record.minValue : ''}${hasMin && hasMax ? '~' : ''}${hasMax ? record.maxValue : ''}${record.units || ''})` : record.dataTypeDesc;
  }
  // 其他类型
  return record.dataTypeDesc;
};

const getDataSource = async () => {
  if (!formData.sfc) {
    dataSource.value = [];
    ElMessage.warning('产品条码不能为空');
    return;
  }

  loading.value = true;
  const res: any = await services.queryDataCollectionBySfc({
    operation: props.podConfig?.operation,
    resource: props?.podConfig.resource,
    sfc: formData.sfc
  });

  loading.value = false;
  if (res.success) {
    let array: DcDetail[] = [];
    const firstArray: any = res.data.dataCollectionResponseList || [];
    itemGroupRef.value = res.data.itemGroupRef;
    itemRef.value = res.data.itemRef;
    if (firstArray.length > 0) {
      let idCounter = 0;
      firstArray.forEach((data: any) => {
        if (data.dataCollectionDetailVoList && data.dataCollectionDetailVoList.length > 0) {
          data.dataCollectionDetailVoList.forEach((item: any) => {
            item.firstDescription = data.description;
            item.dcGroupAndRevision = `${item.dcGroup}/${item.dcGroupRevision}`;
            item.id = idCounter++;
            item.contentRule = item.extFieldsVoList?.find((field: any) => field.fieldName === 'CUSTOMER_SFC_RULE')?.value;
          });
          array = array.concat(data.dataCollectionDetailVoList);
        }
      });
      console.log('array', array);
    } else {
      ElMessage.warning('数据收集参数列表为空');
    }
    dataSource.value = array;

    await nextTick(() => {
      if (inputRefs.value[0]) {
        inputRefs.value[0].focus();
        inputRefs.value[0].select();
      }
    });
  } else {
    ElMessage.warning(res.msg || res.message || '系统错误');
  }
};

const callbackValidate = (errorMsg: string, validateStatus: string, record: DcDetail) => {
  (dataSource.value || []).forEach((val: DcDetail) => {
    if (val.id === record.id) {
      val.errorMsg = errorMsg;
      val.validateStatus = validateStatus;
    }
  });
  return validateStatus;
};

const handleChange = async (record: DcDetail, index: number) => {
  const idx = record.id;
  const result = record[`result${idx}`];
  let { errorMsg, validateStatus } = {
    validateStatus: 'success',
    errorMsg: ''
  };

  if (!record.required && !result) {
    if (dataSource.value.length > idx + 1) {
      await nextTick(() => {
        if (inputRefs.value[index + 1]) {
          inputRefs.value[index + 1].focus();
          inputRefs.value[index + 1].select();
        }
      });
      return callbackValidate(errorMsg, validateStatus, record);
    }
  }

  // 校验输入规则
  if (record.contentRule && result) {
    const regex = new RegExp(record.contentRule);
    if (!regex.test(result)) {
      errorMsg = `输入内容:${result}与设置的结果规则:${record.contentRule}不匹配`;
      validateStatus = 'error';
      await nextTick(() => {
        if (inputRefs.value[index]) {
          inputRefs.value[index].focus();
          inputRefs.value[index].select();
        }
      });

      return callbackValidate(errorMsg, validateStatus, record);
    }
  }

  if (record.required && !record[`result${idx}`]) {
    errorMsg = '必填项目';
    validateStatus = 'error';
    await nextTick(() => {
      if (inputRefs.value[index]) {
        inputRefs.value[index].focus();
        inputRefs.value[index].select();
      }
    });
    return callbackValidate(errorMsg, validateStatus, record);
  }

  if (record.dataType === 'N' && Number.isNaN(Number(record[`result${idx}`]))) {
    errorMsg = '数字类型不正确';
    validateStatus = 'error';
    await nextTick(() => {
      if (inputRefs.value[index]) {
        inputRefs.value[index].focus();
        inputRefs.value[index].select();
      }
    });
    return callbackValidate(errorMsg, validateStatus, record);
  }

  if (record.dataType === 'B' && record[`result${idx}`] !== record.booleanTrueValue && record[`result${idx}`] !== record?.booleanFalseValue) {
    errorMsg = `判断条件不匹配${record.booleanTrueValue}/${record.booleanFalseValue}`;
    validateStatus = 'error';
    await nextTick(() => {
      if (inputRefs.value[index]) {
        inputRefs.value[index].focus();
        inputRefs.value[index].select();
      }
    });
    return callbackValidate(errorMsg, validateStatus, record);
  }

  if (dataSource.value.length > idx + 1) {
    await nextTick(() => {
      if (inputRefs.value[index + 1]) {
        inputRefs.value[index + 1].focus();
        inputRefs.value[index + 1].select();
      }
    });
    return callbackValidate(errorMsg, validateStatus, record);
  }

  return callbackValidate(errorMsg, validateStatus, record);
};

const handleOk = async () => {
  const params = {
    activityId: '',
    sfc: formData.sfc,
    dataCollectionDetailVOList: dataSource.value,
    operation: props.podConfig?.podConfigVO?.defaultOperation,
    resource: props.podConfig?.podConfigVO?.defaultResource,
    itemGroupRef: itemGroupRef.value,
    itemRef: itemRef.value
  };

  const arr = params.dataCollectionDetailVOList.filter((item) => {
    const idx = item.id;
    if (item[`result${idx}`]) {
      item.actualVal = item[`result${idx}`];
    }
    return item.validateStatus === 'error' || (item.required && !item[`result${idx}`]);
  });

  if (arr.length > 0) {
    return;
  }

  params.dataCollectionDetailVOList = params.dataCollectionDetailVOList.filter((item) => {
    return item.actualVal;
  });

  loading.value = true;
  const res: any = await services.dataCollectPassSfc(params);
  loading.value = false;

  if (res.success) {
    ElMessage.success(res.msg || res.message || '数据收集完成');
    dataSource.value = [];
    formData.sfc = '';
    await nextTick(() => {
      if (sfcRef.value) {
        sfcRef.value.focus();
        sfcRef.value.select();
      }
    });
    return true;
  } else {
    ElMessage.warning(res.msg || res.message || '系统错误');
    return false;
  }
};

const keyDownTab = async () => {
  pagination.current = 1;
  await getDataSource();
};

const keyDownTableTab = async (record: DcDetail, index: number) => {
  const validateResult = await handleChange(record, index);
  if (validateResult === 'error') {
    return;
  }
  await handleOk();
};

const handleDialogOpened = () => {
  if (sfcRef.value) {
    sfcRef.value.focus();
  }
};
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

onMounted(async () => {
  // Initialization code if needed
});

defineExpose({
  openDialog,
  closeDialog
});
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="70%" :fullscreen="isFullscreen" append-to-body @opened="handleDialogOpened">
    <template #header="{ titleId, titleClass }">
      <div class="my-header">
        <div :id="titleId" :class="titleClass">{{ title }}</div>
        <el-button @click="toggleFullscreen" size="small" circle>
          <el-icon>
            <el-icon><FullScreen /></el-icon>
          </el-icon>
        </el-button>
      </div>
    </template>
    <el-input ref="inputRef" v-model.trim="formData.sfc" @keydown.tab.prevent="keyDownTab" @keydown.enter.prevent="keyDownTab">
      <template #prepend> 产品条码 </template>
      <template #suffix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <el-table :data="dataSource" border style="margin-top: 10px; width: 100%" :scroll="{ x: 'max-content' }">
      <el-table-column label="序号" align="center" width="60">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>

      <el-table-column prop="dcGroupAndRevision" label="数据收集组" align="center" />
      <el-table-column prop="contentRule" label="规则" align="center" width="100" />
      <el-table-column prop="dcParameter" label="参数编号" align="center">
        <template #default="{ row }">
          <span v-if="row?.required" class="span-title">*</span>
          {{ row.dcParameter || ' ' }}
        </template>
      </el-table-column>

      <el-table-column prop="description" label="参数描述" align="center" show-overflow-tooltip />

      <el-table-column label="类型" align="center">
        <template #default="{ row }">
          {{ getDataTypeDesc(row) }}
        </template>
      </el-table-column>

      <el-table-column label="值" align="center" width="200">
        <template #default="{ row, $index }">
          <div class="editable-cell">
            <div class="editable-cell-input-wrapper">
              <el-form-item :prop="`result${row.id}`" :error="row.errorMsg">
                <el-input
                  :ref="(el: any) => setInputRef(el, $index)"
                  v-model="row[`result${row.id}`]"
                  @keydown.tab.prevent="keyDownTableTab(row, $index)"
                  @keydown.enter.prevent="keyDownTableTab(row, $index)"
                />
              </el-form-item>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="备注" align="center" width="150">
        <template #default="{ row }">
          <el-input v-model="row.remark" :tabindex="-1" />
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 16px;
}
.editable-cell {
  position: relative;
}

.editable-cell-input-wrapper,
.editable-cell-text-wrapper {
  padding-right: 24px;
}

.editable-cell-text-wrapper {
  padding: 5px 24px 5px 5px;
}

.editable-cell-icon,
.editable-cell-icon-check {
  position: absolute;
  right: 0;
  width: 20px;
  cursor: pointer;
}

.editable-cell-icon {
  margin-top: 4px;
  display: none;
}

.editable-cell-icon-check {
  line-height: 28px;
}

.editable-cell-icon:hover,
.editable-cell-icon-check:hover {
  color: #108ee9;
}

.editable-add-btn {
  margin-bottom: 8px;
}

.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}

.span-title {
  color: red;
}

.el-input {
  margin-bottom: 10px;
}
</style>
