<template>
  <div class="p-2 next-number-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="编号类型" prop="nextNumberType">
              <el-select v-model="queryParams.nextNumberType" placeholder="请选择编号类型" clearable filterable @change="handleQuery">
                <el-option v-for="item in nextNumberTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="定义方式" prop="definedBy">
              <el-select v-model="queryParams.definedBy" placeholder="请选择定义方式" clearable filterable @change="handleQuery">
                <el-option v-for="item in definedByOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="编号对象" prop="contextBo">
              <el-input v-model="queryParams.contextBo" placeholder="请输入编号对象" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:number:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:number:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">编辑</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:number:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:number:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="numberList" border row-key="id" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="序号" type="index" width="70" align="center" />
        <el-table-column label="编号类型" align="center" prop="nextNumberType" min-width="130">
          <template #default="{ row }">{{ getOptionLabel(nextNumberTypeOptions, row.nextNumberType) }}</template>
        </el-table-column>
        <el-table-column label="定义方式" align="center" prop="definedBy" min-width="110">
          <template #default="{ row }">{{ getOptionLabel(definedByOptions, row.definedBy) }}</template>
        </el-table-column>
        <el-table-column label="编号对象" align="center" prop="contextBo" min-width="180">
          <template #default="{ row }">{{ formatContextBo(row.contextBo) }}</template>
        </el-table-column>
        <el-table-column label="版本" align="center" min-width="90">
          <template #default="{ row }">{{ getContextRevision(row.contextBo) }}</template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column label="示例" align="center" prop="example" min-width="220" show-overflow-tooltip />
        <el-table-column label="创建人" align="center" prop="creator" min-width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template #default="{ row }">{{ parseTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="最终修改人" align="center" prop="updater" min-width="110" />
        <el-table-column label="最终修改时间" align="center" prop="modifyTime" width="170">
          <template #default="{ row }">{{ parseTime(row.modifyTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" width="110">
          <template #default="{ row }">
            <el-tooltip content="编辑" placement="top">
              <el-button v-hasPermi="['mes:number:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['mes:number:remove']" link type="danger" icon="Delete" @click="handleDelete(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-drawer v-model="drawer.visible" :title="drawer.title" size="82%" append-to-body destroy-on-close>
      <el-scrollbar height="calc(100vh - 130px)">
        <el-form ref="numberFormRef" :model="form" :rules="rules" label-width="130px" class="number-form">
          <el-card shadow="never" class="mb-[10px]">
            <template #header>
              <span class="section-title">基本信息</span>
            </template>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="编号类型" prop="nextNumberType">
                  <el-select v-model="form.nextNumberType" placeholder="请选择编号类型" filterable :disabled="isEdit" @change="handleTypeChange">
                    <el-option v-for="item in nextNumberTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="定义方式" prop="definedBy">
                  <el-select v-model="form.definedBy" placeholder="请选择定义方式" filterable clearable :disabled="definedByDisabled || isEdit" @change="handleDefinedByChange">
                    <el-option v-for="item in definedByOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="objectLabel" prop="contextObject">
                  <el-select v-model="form.contextObject" :placeholder="objectPlaceholder" filterable remote clearable :remote-method="remoteObjectSearch" :loading="objectLoading" :disabled="objectDisabled || isEdit" @change="handleObjectChange">
                    <el-option v-for="item in objectOptions" :key="item.contextBo" :label="item.label" :value="item.value">
                      <span>{{ item.label }}</span>
                      <span class="option-extra">{{ item.revision }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="版本">
                  <el-input v-model="form.contextRevision" placeholder="版本" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="描述" prop="description">
                  <el-input v-model="form.description" placeholder="请输入描述" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="立即提交更改">
                  <el-switch v-model="commitImmediately" />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="示例">
                  <el-input :model-value="sample" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>

          <el-card shadow="never">
            <template #header>
              <el-row :gutter="10" align="middle">
                <el-col :span="1.5">
                  <span class="section-title">编码信息</span>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="primary" plain icon="Plus" @click="addRuleLine">新增</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="danger" plain icon="Delete" :disabled="!selectedRuleRows.length" @click="removeRuleLine">删除</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="warning" plain icon="Setting" :disabled="!canEditSequence" @click="openSequenceDialog">序列编辑</el-button>
                </el-col>
              </el-row>
            </template>
            <el-table :data="ruleLines" border row-key="rowKey" max-height="420" @selection-change="handleRuleSelectionChange">
              <el-table-column type="selection" width="48" align="center" />
              <el-table-column label="顺序" width="110" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.sequence" :min="1" :step="10" controls-position="right" @change="refreshLine(row)" />
                </template>
              </el-table-column>
              <el-table-column label="类型" min-width="150" align="center">
                <template #default="{ row }">
                  <el-select v-model="row.partType" placeholder="请选择" @change="handlePartTypeChange(row)">
                    <el-option v-for="item in partTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="变量类型" min-width="190" align="center">
                <template #default="{ row }">
                  <el-select v-if="row.partType === 'VARIABLE'" v-model="row.variableType" placeholder="请选择变量类型" filterable @change="refreshLine(row)">
                    <el-option v-for="item in variableTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select v-else-if="row.partType === 'RANDOM_DIGIT'" v-model="row.variableType" placeholder="请选择随机数类型" filterable @change="refreshLine(row)">
                    <el-option v-for="item in randomTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select v-else-if="row.partType === 'CRYPTIC_VARIABLE'" v-model="row.variableType" placeholder="请选择隐码变量" filterable @change="refreshLine(row)">
                    <el-option v-for="item in hiddenCodeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <span v-else>/</span>
                </template>
              </el-table-column>
              <el-table-column label="示例" min-width="130" align="center" prop="example1" />
              <el-table-column label="固定值/随机数位数" min-width="180" align="center">
                <template #default="{ row }">
                  <el-input-number v-if="row.partType === 'RANDOM_DIGIT'" v-model="row.fixedValue" :min="1" :max="64" controls-position="right" @change="refreshLine(row)" />
                  <el-input v-else v-model="row.fixedValue" :disabled="row.partType !== 'FIXED'" clearable @input="refreshLine(row)" />
                </template>
              </el-table-column>
              <el-table-column label="最小序列" min-width="110" align="center" prop="minSequence" />
              <el-table-column label="最大序列" min-width="110" align="center" prop="maxSequence" />
              <el-table-column label="序列长度" min-width="110" align="center" prop="sequenceLength" />
              <el-table-column label="当前序列" min-width="110" align="center" prop="currentSequence" />
              <el-table-column label="重置规则" min-width="120" align="center">
                <template #default="{ row }">{{ getOptionLabel(resetRuleOptions, row.resetRule) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-form>
      </el-scrollbar>
      <template #footer>
        <el-button @click="drawer.visible = false">取消</el-button>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="sequenceDialog.visible" title="序列规则" width="520px" append-to-body>
      <el-form ref="sequenceFormRef" :model="sequenceForm" :rules="sequenceRules" label-width="110px">
        <el-form-item label="序列长度" prop="sequenceLength">
          <el-input-number v-model="sequenceForm.sequenceLength" :min="1" :max="32" controls-position="right" />
        </el-form-item>
        <el-form-item label="最小序列" prop="minSequence">
          <el-input-number v-model="sequenceForm.minSequence" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="最大序列" prop="maxSequence">
          <el-input-number v-model="sequenceForm.maxSequence" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="当前序列">
          <el-input-number v-model="sequenceForm.currentSequence" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="阈值警告">
          <el-input-number v-model="sequenceForm.warningThreshold" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="重置规则" prop="resetRule">
          <el-select v-model="sequenceForm.resetRule" placeholder="请选择重置规则">
            <el-option v-for="item in resetRuleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="示例">
          <el-input :model-value="buildSequenceSample(sequenceForm)" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sequenceDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSequenceDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Number" lang="ts">
import { listHiddenCode } from '@/api/mes/hiddenCode';
import { getNumberDetail, listNumber, addNumberDetail, updateNumberDetail, delNumber, listNumberObject } from '@/api/mes/number';
import { NumberDetailForm, NumberDetailVO, NumberObjectOption, NumberQuery, NumberRuleLineVO, NumberVO } from '@/api/mes/number/types';

type Option = {
  label: string;
  value: string;
};

type RuleLine = NumberRuleLineVO & {
  rowKey: string | number;
};

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const nextNumberTypeOptions: Option[] = [
  { label: '物料条码', value: 'ITEM' },
  { label: '产品条码', value: 'PRODUCT' },
  { label: '客户条码', value: 'CUSTOMER_BARCODE' },
  { label: '载具编号', value: 'VEHICLE' },
  { label: '容器编号', value: 'CONTAINER' },
  { label: '工具编号', value: 'TOOL' },
  { label: '栈板编号', value: 'PALLET' }
];

const definedByOptions: Option[] = [
  { label: '物料', value: 'ITEM' },
  { label: '物料组', value: 'ITEM_GROUP' }
];

const partTypeOptions: Option[] = [
  { label: '固定值', value: 'FIXED' },
  { label: '变量', value: 'VARIABLE' },
  { label: '序列', value: 'SEQUENCE' },
  { label: '随机数', value: 'RANDOM_DIGIT' },
  { label: '隐码变量', value: 'CRYPTIC_VARIABLE' }
];

const variableTypeOptions: Option[] = [
  { label: '物料', value: 'I' },
  { label: '工单', value: 'SO' },
  { label: '工作中心', value: 'WC' },
  { label: '仓库', value: 'SL' },
  { label: '两位年', value: 'YY' },
  { label: '四位年', value: 'YYYY' },
  { label: '月', value: 'MM' },
  { label: '日', value: 'DD' },
  { label: '线别/批次/班别', value: 'SHIFT' },
  { label: '客户料号', value: 'CUSTOMER_ITEM' },
  { label: '年度第几天', value: 'DAY_OF_YEAR' },
  { label: '星期几(星期天)', value: 'SUN_DAY_OF_WEEK' },
  { label: '年度周数(星期天)', value: 'SUN_WEEK_OF_YEAR' },
  { label: '星期几(星期一)', value: 'MON_DAY_OF_WEEK' },
  { label: '年度周数(星期一)', value: 'MON_WEEK_OF_YEAR' },
  { label: '一位年', value: 'ONE_BIT_YEAR' },
  { label: '订单号', value: 'ORDER' }
];

const randomTypeOptions: Option[] = [
  { label: '随机数-混合', value: 'RANDOM_ALL' },
  { label: '随机数-字母', value: 'RANDOM_LETTER' },
  { label: '随机数-数字', value: 'RANDOM_NUMBER' }
];

const resetRuleOptions: Option[] = [
  { label: '从不', value: 'NEVER' },
  { label: '每天', value: 'DAY' },
  { label: '每周', value: 'WEEK' },
  { label: '每月', value: 'MONTH' },
  { label: '每年', value: 'YEAR' }
];

const variableSamples: Record<string, string> = {
  DD: '01',
  MM: '01',
  YYYY: '2022',
  YY: '22',
  SL: '1001',
  WC: 'WC0001',
  SO: 'S000001',
  I: '1000001',
  HYHY: 'CCAC',
  HY: 'CC',
  HM: '1',
  HD: 'K',
  SHIFT: 'A',
  CUSTOMER_ITEM: 'CUS001',
  DAY_OF_YEAR: '001',
  SUN_DAY_OF_WEEK: '1',
  SUN_WEEK_OF_YEAR: '01',
  MON_DAY_OF_WEEK: '1',
  MON_WEEK_OF_YEAR: '01',
  ONE_BIT_YEAR: '6',
  ORDER: 'PO0001'
};

const numberList = ref<NumberVO[]>([]);
const loading = ref(false);
const buttonLoading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const isEdit = ref(false);
const objectLoading = ref(false);
const objectOptions = ref<NumberObjectOption[]>([]);
const hiddenCodeOptions = ref<Option[]>([]);
const selectedRuleRows = ref<RuleLine[]>([]);
const activeSequenceRow = ref<RuleLine>();

const queryFormRef = ref<ElFormInstance>();
const numberFormRef = ref<ElFormInstance>();
const sequenceFormRef = ref<ElFormInstance>();

const drawer = reactive<DialogOption>({
  visible: false,
  title: ''
});

const sequenceDialog = reactive<DialogOption>({
  visible: false,
  title: '序列规则'
});

const initFormData: NumberDetailForm = {
  id: undefined,
  handle: undefined,
  nextNumberType: undefined,
  definedBy: undefined,
  contextBo: undefined,
  contextObject: undefined,
  contextRevision: undefined,
  description: undefined,
  commitImmediately: 'false',
  example: undefined,
  dataModifyUser: undefined,
  nextNumberRuleSaveVOList: []
};

const data = reactive<PageData<NumberDetailForm, NumberQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    nextNumberType: undefined,
    definedBy: undefined,
    contextBo: undefined,
    description: undefined,
    params: {}
  },
  rules: {
    nextNumberType: [{ required: true, message: '请选择编号类型', trigger: 'change' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const ruleLines = ref<RuleLine[]>([]);
const sequenceForm = reactive<NumberRuleLineVO>({
  sequenceLength: 6,
  minSequence: 1,
  maxSequence: 999999,
  currentSequence: 0,
  warningThreshold: 0,
  resetRule: 'NEVER'
});

const sequenceRules = {
  sequenceLength: [{ required: true, message: '请输入序列长度', trigger: 'blur' }],
  minSequence: [{ required: true, message: '请输入最小序列', trigger: 'blur' }],
  resetRule: [{ required: true, message: '请选择重置规则', trigger: 'change' }]
};

const commitImmediately = computed({
  get: () => form.value.commitImmediately === 'true',
  set: (value: boolean) => {
    form.value.commitImmediately = value ? 'true' : 'false';
  }
});

const definedByDisabled = computed(() => !['PRODUCT', 'ITEM', 'CUSTOMER_BARCODE'].includes(form.value.nextNumberType || ''));
const objectDisabled = computed(() => definedByDisabled.value || !form.value.definedBy);
const objectLabel = computed(() => (form.value.definedBy === 'ITEM_GROUP' ? '编号对象物料组' : '编号对象物料'));
const objectPlaceholder = computed(() => (form.value.definedBy === 'ITEM_GROUP' ? '请选择物料组' : '请选择物料'));
const canEditSequence = computed(() => selectedRuleRows.value.length === 1 && selectedRuleRows.value[0].partType === 'SEQUENCE');
const sample = computed(() => buildSample(ruleLines.value));

watch(sample, (value) => {
  form.value.example = value;
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await listNumber(queryParams.value);
    numberList.value = getRows<NumberVO>(res);
    total.value = getTotal(res);
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  form.value = { ...initFormData };
  ruleLines.value = [];
  objectOptions.value = [];
  selectedRuleRows.value = [];
  numberFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: NumberVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = async () => {
  reset();
  isEdit.value = false;
  drawer.title = '新增编号规则';
  drawer.visible = true;
  await loadHiddenCodes();
};

const handleUpdate = async (row?: NumberVO) => {
  reset();
  isEdit.value = true;
  const id = row?.id || ids.value[0];
  const res = await getNumberDetail(id);
  const detail = getData<NumberDetailVO>(res);
  const contextInfo = parseContextBo(detail.contextBo);
  form.value = {
    ...initFormData,
    ...detail,
    contextObject: contextInfo.object,
    contextRevision: contextInfo.revision,
    dataModifyUser: contextInfo.object
  };
  objectOptions.value = contextInfo.object
    ? [
        {
          label: contextInfo.object,
          value: contextInfo.object,
          revision: contextInfo.revision,
          contextBo: detail.contextBo || ''
        }
      ]
    : [];
  ruleLines.value = (detail.nextNumberRuleVOList || []).map((item, index) => ({
    ...item,
    rowKey: item.id || `row_${index}_${Date.now()}`,
    example1: buildLineSample(item)
  }));
  drawer.title = '编辑编号规则';
  drawer.visible = true;
  await loadHiddenCodes();
};

const submitForm = () => {
  numberFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    if (!ruleLines.value.length) {
      proxy?.$modal.msgWarning('请至少维护一条编码信息');
      return;
    }
    const invalidLine = ruleLines.value.find((line) => !line.partType || line.sequence === undefined || line.sequence === null);
    if (invalidLine) {
      proxy?.$modal.msgWarning('请完善编码信息的顺序和类型');
      return;
    }
    buttonLoading.value = true;
    const payload: NumberDetailForm = {
      ...form.value,
      example: sample.value,
      nextNumberRuleSaveVOList: ruleLines.value
        .slice()
        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
        .map(({ rowKey, example1, ...line }) => line)
    };
    try {
      if (payload.id) {
        await updateNumberDetail(payload);
      } else {
        await addNumberDetail(payload);
      }
      proxy?.$modal.msgSuccess('保存成功');
      drawer.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row?: NumberVO) => {
  const deleteIds = row?.id || ids.value;
  await proxy?.$modal.confirm(`是否确认删除编号规则 ${deleteIds} 的数据项？`);
  await delNumber(deleteIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download('mes/number/export', { ...queryParams.value }, `number_${Date.now()}.xlsx`);
};

const handleTypeChange = () => {
  form.value.definedBy = undefined;
  form.value.contextBo = undefined;
  form.value.contextObject = undefined;
  form.value.contextRevision = undefined;
  form.value.dataModifyUser = undefined;
};

const handleDefinedByChange = () => {
  form.value.contextBo = undefined;
  form.value.contextObject = undefined;
  form.value.contextRevision = undefined;
  form.value.dataModifyUser = undefined;
  objectOptions.value = [];
};

const remoteObjectSearch = async (keyword: string) => {
  if (!form.value.definedBy) {
    return;
  }
  objectLoading.value = true;
  try {
    const res = await listNumberObject({ definedBy: form.value.definedBy, keyword });
    objectOptions.value = getData<NumberObjectOption[]>(res, []);
  } finally {
    objectLoading.value = false;
  }
};

const handleObjectChange = (value?: string) => {
  const selected = objectOptions.value.find((item) => item.value === value);
  form.value.contextBo = selected?.contextBo || (value ? buildContextBo(form.value.definedBy || '', value, selected?.revision) : undefined);
  form.value.contextRevision = selected?.revision || '';
  form.value.dataModifyUser = value;
};

const addRuleLine = () => {
  const maxSequence = Math.max(0, ...ruleLines.value.map((line) => Number(line.sequence || 0)));
  const line: RuleLine = {
    rowKey: `new_${Date.now()}_${Math.random()}`,
    sequence: maxSequence ? (Math.floor(maxSequence / 10) + 1) * 10 : 10,
    partType: 'FIXED',
    fixedValue: ''
  };
  refreshLine(line);
  ruleLines.value.push(line);
};

const removeRuleLine = async () => {
  const keys = selectedRuleRows.value.map((item) => item.rowKey);
  ruleLines.value = ruleLines.value.filter((item) => !keys.includes(item.rowKey));
  selectedRuleRows.value = [];
};

const handleRuleSelectionChange = (selection: RuleLine[]) => {
  selectedRuleRows.value = selection;
};

const handlePartTypeChange = (row: RuleLine) => {
  row.variableType = undefined;
  row.fixedValue = row.partType === 'SEQUENCE' ? undefined : '';
  if (row.partType === 'SEQUENCE') {
    row.sequenceLength = row.sequenceLength || 4;
    row.minSequence = row.minSequence || 1;
    row.maxSequence = row.maxSequence || 9999;
    row.currentSequence = row.currentSequence || 0;
    row.warningThreshold = row.warningThreshold || 0;
    row.resetRule = row.resetRule || 'NEVER';
  } else {
    row.minSequence = undefined;
    row.maxSequence = undefined;
    row.sequenceLength = undefined;
    row.currentSequence = undefined;
    row.warningThreshold = undefined;
    row.resetRule = undefined;
  }
  refreshLine(row);
};

const refreshLine = (row: NumberRuleLineVO) => {
  row.example1 = buildLineSample(row);
};

const openSequenceDialog = () => {
  activeSequenceRow.value = selectedRuleRows.value[0];
  Object.assign(sequenceForm, {
    sequenceLength: activeSequenceRow.value.sequenceLength || 4,
    minSequence: activeSequenceRow.value.minSequence || 1,
    maxSequence: activeSequenceRow.value.maxSequence || 9999,
    currentSequence: activeSequenceRow.value.currentSequence || 0,
    warningThreshold: activeSequenceRow.value.warningThreshold || 0,
    resetRule: activeSequenceRow.value.resetRule || 'NEVER'
  });
  sequenceDialog.visible = true;
};

const saveSequenceDialog = () => {
  sequenceFormRef.value?.validate((valid: boolean) => {
    if (!valid || !activeSequenceRow.value) {
      return;
    }
    Object.assign(activeSequenceRow.value, sequenceForm);
    refreshLine(activeSequenceRow.value);
    sequenceDialog.visible = false;
  });
};

const loadHiddenCodes = async () => {
  const res = await listHiddenCode({ pageNum: 1, pageSize: 500 } as any);
  hiddenCodeOptions.value = getRows<any>(res).map((item: any) => ({
    label: item.description || item.hiddenCodeGroup,
    value: item.hiddenCodeGroup
  }));
};

const getData = <T,>(response: unknown, fallback?: T): T => {
  const payload = response as { data?: T } | T | undefined;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data ?? (fallback as T);
  }
  return (payload as T) ?? (fallback as T);
};

const getRows = <T,>(response: unknown): T[] => {
  const payload = response as { rows?: T[]; data?: { rows?: T[] } | T[] } | undefined;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.rows)) {
    return payload.data.rows;
  }
  return [];
};

const getTotal = (response: unknown) => {
  const payload = response as { total?: number; data?: { total?: number } } | undefined;
  return Number(payload?.total ?? payload?.data?.total ?? 0);
};

function buildSample(lines: NumberRuleLineVO[]) {
  return lines
    .slice()
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
    .map((line) => line.example1 || buildLineSample(line))
    .join('');
}

function buildLineSample(line: NumberRuleLineVO) {
  if (line.partType === 'FIXED') {
    return line.fixedValue || '';
  }
  if (line.partType === 'VARIABLE') {
    return variableSamples[line.variableType || ''] || '';
  }
  if (line.partType === 'SEQUENCE') {
    return buildSequenceSample(line);
  }
  if (line.partType === 'RANDOM_DIGIT') {
    const length = Number(line.fixedValue || 0);
    return length > 0 ? 'X'.repeat(Math.min(length, 32)) : '';
  }
  if (line.partType === 'CRYPTIC_VARIABLE') {
    return getOptionLabel(hiddenCodeOptions.value, line.variableType) || '';
  }
  return '';
}

function buildSequenceSample(line: NumberRuleLineVO) {
  const minSequence = String(line.minSequence ?? 1);
  const sequenceLength = Number(line.sequenceLength || minSequence.length);
  return minSequence.padStart(sequenceLength, '0');
}

function getOptionLabel(options: Option[], value?: string) {
  return options.find((item) => item.value === value)?.label || value || '';
}

const buildContextBo = (definedBy: string, value: string, revision?: string) => {
  if (!value) {
    return '';
  }
  if (definedBy === 'ITEM_GROUP') {
    return `ItemGroupBO:CN00,${value}`;
  }
  return `ItemBO:CN00,${value},${revision || 'A0'}`;
};

const parseContextBo = (contextBo?: string) => {
  if (!contextBo) {
    return { object: '', revision: '' };
  }
  const parts = contextBo.split(',');
  return {
    object: parts[1] || contextBo,
    revision: parts[2] || ''
  };
};

const formatContextBo = (contextBo?: string) => parseContextBo(contextBo).object;
const getContextRevision = (contextBo?: string) => parseContextBo(contextBo).revision;

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.next-number-page {
  .section-title {
    display: inline-flex;
    align-items: center;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-title::before {
    width: 4px;
    height: 18px;
    margin-right: 8px;
    content: '';
    background: var(--el-color-primary);
    border-radius: 2px;
  }

  .number-form {
    padding-right: 12px;
  }

  .option-extra {
    float: right;
    padding-left: 20px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>
