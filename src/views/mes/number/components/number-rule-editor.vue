<template>
  <div class="number-rule-editor">
    <el-form ref="numberFormRef" :model="form" :rules="rules" label-width="130px" class="number-form">
      <el-card shadow="never" class="editor-section base-info-section mb-[10px]">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>
        <el-row :gutter="16" class="base-info-grid">
          <el-col :span="24">
            <el-form-item label="编号类型" prop="nextNumberType">
              <el-select v-model="form.nextNumberType" placeholder="请选择编号类型" filterable :disabled="isEdit" @change="handleTypeChange">
                <el-option v-for="item in nextNumberTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="定义方式" prop="definedBy">
              <el-select v-model="form.definedBy" placeholder="请选择定义方式" filterable clearable :disabled="definedByDisabled || isEdit" @change="handleDefinedByChange">
                <el-option v-for="item in definedByOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="objectLabel" prop="contextObject">
              <el-input v-model="form.contextObject" :placeholder="objectPlaceholder" readonly clearable :disabled="objectDisabled || isEdit" @clear="handleObjectClear">
                <template #append>
                  <el-button icon="Search" :disabled="objectDisabled || isEdit" @click="openObjectDialog">选择</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本">
              <el-input v-model="form.contextRevision" placeholder="版本" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="立即提交更改">
              <el-switch v-model="commitImmediately" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="示例">
              <el-input :model-value="sample" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="never" class="editor-section code-info-section">
        <template #header>
          <span class="section-title">编码信息</span>
        </template>
        <div class="code-toolbar">
          <el-button plain icon="Plus" size="small" @click="addRuleLine">新增</el-button>
          <el-button plain icon="Delete" size="small" :disabled="!selectedRuleRows.length" @click="removeRuleLine">删除</el-button>
          <el-button plain icon="Setting" size="small" :disabled="!canEditSequence" @click="openSequenceDialog">序列编辑</el-button>
        </div>
        <el-table :data="ruleLines" border row-key="rowKey" max-height="520" @selection-change="handleRuleSelectionChange">
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

    <el-dialog v-model="objectDialog.visible" :title="objectDialog.title" width="920px" append-to-body destroy-on-close>
      <el-form :model="objectQuery" :inline="true">
        <template v-if="form.definedBy === 'ITEM_GROUP'">
          <el-form-item label="物料组">
            <el-input v-model="objectQuery.itemGroup" placeholder="请输入物料组" clearable @keyup.enter="handleObjectQuery" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="objectQuery.description" placeholder="请输入描述" clearable @keyup.enter="handleObjectQuery" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="物料">
            <el-input v-model="objectQuery.item" placeholder="请输入物料" clearable @keyup.enter="handleObjectQuery" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="objectQuery.itemDesc" placeholder="请输入描述" clearable @keyup.enter="handleObjectQuery" />
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleObjectQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetObjectQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="objectDialog.loading" :data="objectList" border max-height="430" @row-dblclick="selectObject">
        <el-table-column width="55" align="center">
          <template #default="{ row }">
            <el-radio :model-value="selectedObjectHandle" :value="row.handle" @change="selectObject(row)" />
          </template>
        </el-table-column>
        <template v-if="form.definedBy === 'ITEM_GROUP'">
          <el-table-column label="物料组" prop="itemGroup" min-width="160" show-overflow-tooltip />
          <el-table-column label="描述" prop="description" min-width="220" show-overflow-tooltip />
        </template>
        <template v-else>
          <el-table-column label="物料" prop="item" min-width="160" show-overflow-tooltip />
          <el-table-column label="描述" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ row.itemDesc || row.description }}</template>
          </el-table-column>
          <el-table-column label="版本" prop="revision" width="100" align="center" />
        </template>
      </el-table>
      <pagination v-show="objectTotal > 0" v-model:page="objectQuery.pageNum" v-model:limit="objectQuery.pageSize" :total="objectTotal" @pagination="getObjectList" />
    </el-dialog>

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

<script setup lang="ts">
import { listHiddenCode } from '@/api/mes/hiddenCode';
import { addNumberDetail, getNumberDetail, listNumberItem, listNumberItemGroup, updateNumberDetail } from '@/api/mes/number';
import { NumberDetailForm, NumberDetailVO, NumberRuleLineVO } from '@/api/mes/number/types';

type Option = {
  label: string;
  value: string;
};

type RuleLine = NumberRuleLineVO & {
  rowKey: string | number;
};

type ObjectRow = Record<string, any>;

const props = defineProps({
  id: {
    type: [String, Number],
    default: undefined
  }
});

const emit = defineEmits(['loaded', 'saved']);
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
  { label: '每天(默认0点)', value: 'DAY' },
  { label: '每月(默认1号)', value: 'MONTH' },
  { label: '从不', value: 'NEVER' },
  { label: '每周(默认周一)', value: 'WEEK' },
  { label: '每年(每年一月一号)', value: 'YEAR' }
];

const variableSamples: Record<string, string> = {
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
  ORDER: 'PO0001'
};

const padNumber = (value: number, length = 2) => String(value).padStart(length, '0');

const getDayOfYear = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - firstDay.getTime()) / 86400000) + 1;
};

const getWeekOfYear = (date: Date, weekStartsOn: 0 | 1) => {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const offset = (firstDay.getDay() - weekStartsOn + 7) % 7;
  return Math.floor((getDayOfYear(date) + offset - 1) / 7) + 1;
};

const getDateVariableSample = (variableType?: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const day = now.getDay();
  const dateSamples: Record<string, string> = {
    DD: padNumber(now.getDate()),
    MM: padNumber(now.getMonth() + 1),
    YYYY: String(year),
    YY: padNumber(year % 100),
    DAY_OF_YEAR: padNumber(getDayOfYear(now), 3),
    SUN_DAY_OF_WEEK: String(day + 1),
    SUN_WEEK_OF_YEAR: padNumber(getWeekOfYear(now, 0)),
    MON_DAY_OF_WEEK: String(day === 0 ? 7 : day),
    MON_WEEK_OF_YEAR: padNumber(getWeekOfYear(now, 1)),
    ONE_BIT_YEAR: String(year % 10)
  };
  return variableType ? dateSamples[variableType] : undefined;
};

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
  nextNumberRuleSaveVOList: []
};

const form = ref<NumberDetailForm>({ ...initFormData });
const ruleLines = ref<RuleLine[]>([]);
const buttonLoading = ref(false);
const isEdit = computed(() => Boolean(props.id));
const hiddenCodeOptions = ref<Option[]>([]);
const selectedRuleRows = ref<RuleLine[]>([]);
const activeSequenceRow = ref<RuleLine>();
const objectList = ref<ObjectRow[]>([]);
const objectTotal = ref(0);
const selectedObjectHandle = ref('');

const numberFormRef = ref<ElFormInstance>();
const sequenceFormRef = ref<ElFormInstance>();

const rules = {
  nextNumberType: [{ required: true, message: '请选择编号类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
};

const sequenceDialog = reactive<DialogOption>({
  visible: false,
  title: '序列规则'
});

const objectDialog = reactive<DialogOption & { loading: boolean }>({
  visible: false,
  title: '',
  loading: false
});

const objectQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  item: undefined as string | undefined,
  itemDesc: undefined as string | undefined,
  itemGroup: undefined as string | undefined,
  description: undefined as string | undefined
});

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

const handleTypeChange = () => {
  form.value.definedBy = undefined;
  handleDefinedByChange();
};

const handleDefinedByChange = () => {
  form.value.contextBo = undefined;
  form.value.contextObject = undefined;
  form.value.contextRevision = undefined;
  objectList.value = [];
  objectTotal.value = 0;
};

const resetObjectQuery = () => {
  objectQuery.pageNum = 1;
  objectQuery.item = undefined;
  objectQuery.itemDesc = undefined;
  objectQuery.itemGroup = undefined;
  objectQuery.description = undefined;
  getObjectList();
};

const handleObjectQuery = () => {
  objectQuery.pageNum = 1;
  getObjectList();
};

const openObjectDialog = () => {
  if (!form.value.definedBy) {
    proxy?.$modal.msgWarning('请先选择定义方式');
    return;
  }
  selectedObjectHandle.value = form.value.contextBo || '';
  objectDialog.title = form.value.definedBy === 'ITEM_GROUP' ? '选择物料组' : '选择物料';
  objectDialog.visible = true;
  resetObjectQuery();
};

const getObjectList = async () => {
  if (!form.value.definedBy) {
    return;
  }
  objectDialog.loading = true;
  try {
    const params = {
      pageNum: objectQuery.pageNum,
      pageSize: objectQuery.pageSize,
      ...(form.value.definedBy === 'ITEM_GROUP' ? { itemGroup: objectQuery.itemGroup, description: objectQuery.description } : { item: objectQuery.item, itemDesc: objectQuery.itemDesc })
    };
    const res = form.value.definedBy === 'ITEM_GROUP' ? await listNumberItemGroup(params) : await listNumberItem(params);
    objectList.value = getRows<ObjectRow>(res);
    objectTotal.value = getTotal(res);
  } finally {
    objectDialog.loading = false;
  }
};

const getObjectCode = (row: ObjectRow) => {
  if (form.value.definedBy === 'ITEM_GROUP') {
    return row.itemGroup || row.group || row.code || row.name || '';
  }
  return row.item || row.itemCode || row.materialCode || row.code || '';
};

const getObjectDescription = (row: ObjectRow) => (form.value.definedBy === 'ITEM_GROUP' ? row.description || row.itemGroupDesc || row.itemGroupName || '' : row.itemDesc || row.description || '');

const handleObjectClear = () => {
  form.value.contextBo = undefined;
  form.value.contextObject = undefined;
  form.value.contextRevision = undefined;
  form.value.description = undefined;
};

const selectObject = (row: ObjectRow) => {
  if (!row?.handle) {
    proxy?.$modal.msgWarning('所选数据缺少handle字段');
    return;
  }
  const objectCode = getObjectCode(row) || row.handle;
  selectedObjectHandle.value = row.handle;
  form.value.contextBo = row.handle;
  form.value.contextObject = objectCode;
  form.value.contextRevision = form.value.definedBy === 'ITEM_GROUP' ? '' : row.revision || row.itemRevision || '';
  form.value.description = getObjectDescription(row) || form.value.description;
  objectDialog.visible = false;
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

const removeRuleLine = () => {
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

const submit = () => {
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
      emit('saved');
    } finally {
      buttonLoading.value = false;
    }
  });
};

const loadHiddenCodes = async () => {
  const res = await listHiddenCode({ pageNum: 1, pageSize: 500 } as any);
  hiddenCodeOptions.value = getRows<any>(res).map((item: any) => ({
    label: item.description || item.hiddenCodeGroup,
    value: item.hiddenCodeGroup
  }));
};

const loadDetail = async () => {
  if (!props.id) {
    return;
  }
  const res = await getNumberDetail(props.id);
  const detail = getData<NumberDetailVO>(res);
  const detailPayload = detail as NumberDetailVO & Pick<NumberDetailForm, 'contextObject' | 'contextRevision'>;
  const contextInfo = parseContextBo(detail.contextBo);
  const contextObject = detailPayload.contextObject || contextInfo.object;
  form.value = {
    ...initFormData,
    ...detailPayload,
    contextObject,
    contextRevision: detailPayload.contextRevision || contextInfo.revision
  };
  ruleLines.value = getDetailRuleLines(detail).map((item, index) => ({
    ...item,
    rowKey: item.id || `row_${index}_${Date.now()}`,
    example1: buildLineSample(item)
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

const getDetailRuleLines = (detail: NumberDetailVO): NumberRuleLineVO[] => {
  const payload = detail as NumberDetailVO & {
    nextNumberRuleList?: NumberRuleLineVO[];
    nextNumberRuleSaveVOList?: NumberRuleLineVO[];
    ruleList?: NumberRuleLineVO[];
    rules?: NumberRuleLineVO[];
    detailList?: NumberRuleLineVO[];
  };
  const candidates = [payload.nextNumberRuleVOList, payload.nextNumberRuleList, payload.nextNumberRuleSaveVOList, payload.ruleList, payload.rules, payload.detailList].filter(Array.isArray);
  return candidates.find((item) => item.length) || candidates[0] || [];
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
    return getDateVariableSample(line.variableType) || variableSamples[line.variableType || ''] || '';
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

onMounted(async () => {
  try {
    await Promise.all([loadHiddenCodes(), loadDetail()]);
  } finally {
    emit('loaded');
  }
});

defineExpose({ submit, buttonLoading });
</script>

<style scoped lang="scss">
.number-rule-editor {
  background: #fff;

  :deep(.editor-section) {
    border-radius: 0;
  }

  :deep(.editor-section > .el-card__header) {
    min-height: 38px;
    padding: 9px 8px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.editor-section > .el-card__body) {
    padding: 12px 8px;
  }

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

  .base-info-grid {
    max-width: 720px;
    margin: 0 auto;
  }

  .base-info-section :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  .base-info-section :deep(.el-select),
  .base-info-section :deep(.el-input) {
    width: 100%;
  }

  .code-toolbar {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }

  .number-form {
    padding-right: 12px;
  }
}
</style>
