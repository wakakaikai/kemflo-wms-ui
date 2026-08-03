<template>
  <div class="p-2">
    <el-card shadow="hover" class="mb-[10px]">
      <el-form :inline="true">
        <el-form-item label="应用">
          <el-select v-model="selectedAppId" placeholder="请选择应用" clearable filterable @change="handleAppChange" style="width: 200px">
            <el-option v-for="item in appOptions" :key="item.id" :label="item.appName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工作表">
          <el-select v-model="selectedWorksheetId" placeholder="请选择工作表" clearable filterable @change="handleWorksheetChange" style="width: 200px">
            <el-option v-for="item in filteredWorksheets" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :disabled="!selectedWorksheetId" @click="loadViewData">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="mb-[10px]">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="text-[var(--el-text-color-secondary)] mb-1">字段数</div>
          <div class="text-2xl font-semibold">{{ fieldList.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="text-[var(--el-text-color-secondary)] mb-1">记录数</div>
          <div class="text-2xl font-semibold">{{ total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="text-[var(--el-text-color-secondary)] mb-1">必填字段</div>
          <div class="text-2xl font-semibold">{{ requiredFieldCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="text-[var(--el-text-color-secondary)] mb-1">工作表状态</div>
          <div class="text-2xl font-semibold">
            <dict-tag v-if="currentWorksheet" :options="sys_normal_disable" :value="currentWorksheet.status" />
            <span v-else>-</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ currentWorksheet?.displayName || '数据视图' }}</span>
          <el-button v-if="selectedWorksheetId" type="primary" link @click="goRecord">进入数据记录</el-button>
        </div>
      </template>

      <el-empty v-if="!selectedWorksheetId" description="请选择应用和工作表查看数据" :image-size="80" />
      <template v-else>
        <el-table v-loading="loading" border :data="recordList">
          <el-table-column label="记录ID" align="center" prop="id" width="180" show-overflow-tooltip />
          <el-table-column v-for="field in fieldList" :key="field.fieldCode" :label="field.fieldName" align="center" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ getRecordValue(scope.row, field.fieldCode) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="版本" align="center" prop="version" width="80" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" @pagination="loadRecords" />
      </template>
    </el-card>
  </div>
</template>

<script setup name="LcView" lang="ts">
import { listApp } from '@/api/lowcode/app';
import { AppVO } from '@/api/lowcode/app/types';
import { listWorksheet } from '@/api/lowcode/worksheet';
import { WorksheetVO } from '@/api/lowcode/worksheet/types';
import { listField } from '@/api/lowcode/field';
import { FieldVO } from '@/api/lowcode/field/types';
import { listRecord } from '@/api/lowcode/record';
import { RecordVO } from '@/api/lowcode/record/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));
const router = useRouter();

const appOptions = ref<AppVO[]>([]);
const worksheetOptions = ref<WorksheetVO[]>([]);
const fieldList = ref<FieldVO[]>([]);
const recordList = ref<RecordVO[]>([]);
const selectedAppId = ref<string | number | undefined>();
const selectedWorksheetId = ref<string | number | undefined>();
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const filteredWorksheets = computed(() => {
  if (!selectedAppId.value) return worksheetOptions.value;
  return worksheetOptions.value.filter((item) => String(item.appId) === String(selectedAppId.value));
});

const currentWorksheet = computed(() => worksheetOptions.value.find((item) => String(item.id) === String(selectedWorksheetId.value)));
const requiredFieldCount = computed(() => fieldList.value.filter((item) => item.required === 1).length);

const parseRecordData = (row?: RecordVO) => {
  if (!row?.recordDataJson) return {};
  try { return JSON.parse(row.recordDataJson); } catch { return {}; }
};

const getRecordValue = (row: RecordVO, fieldCode?: string) => {
  if (!fieldCode) return '';
  const data = parseRecordData(row);
  const value = data[fieldCode];
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const loadApps = async () => {
  const res = await listApp({ pageNum: 1, pageSize: 999, status: '0' } as any);
  appOptions.value = res.data.rows ?? res.data;
};

const loadWorksheets = async () => {
  const res = await listWorksheet({ pageNum: 1, pageSize: 999, status: '0' } as any);
  worksheetOptions.value = res.data.rows ?? res.data;
};

const loadFields = async () => {
  fieldList.value = [];
  if (!selectedWorksheetId.value) return;
  const res = await listField({ pageNum: 1, pageSize: 999, worksheetId: selectedWorksheetId.value });
  fieldList.value = (res.data.rows ?? res.data ?? []).sort((a: FieldVO, b: FieldVO) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const loadRecords = async () => {
  recordList.value = []; total.value = 0;
  if (!selectedWorksheetId.value) return;
  loading.value = true;
  try {
    const res = await listRecord({ pageNum: pageNum.value, pageSize: pageSize.value, worksheetId: selectedWorksheetId.value });
    recordList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const loadViewData = async () => { pageNum.value = 1; await loadFields(); await loadRecords(); };

const handleAppChange = () => { selectedWorksheetId.value = undefined; fieldList.value = []; recordList.value = []; total.value = 0; };
const handleWorksheetChange = async () => { await loadViewData(); };

const goRecord = () => {
  router.push({ path: '/lowcode/record', query: { worksheetId: String(selectedWorksheetId.value!) } });
};

onMounted(async () => { await Promise.all([loadApps(), loadWorksheets()]); });
</script>