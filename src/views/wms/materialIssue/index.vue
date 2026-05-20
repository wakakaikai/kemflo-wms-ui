<template>
  <div class="p-2">
    <el-tabs v-model="statusTab" class="mb-2" @tab-change="onStatusTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待发料" name="PENDING" />
      <el-tab-pane label="发料中" name="ISSUING" />
      <el-tab-pane label="已完成" name="COMPLETED" />
      <el-tab-pane label="已取消" name="CANCELLED" />
    </el-tabs>

    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="发料单号" prop="issueNo">
              <el-input v-model="queryParams.issueNo" placeholder="发料单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发料状态" prop="issueStatus">
              <el-select v-model="queryParams.issueStatus" placeholder="全部" clearable style="width: 140px">
                <el-option label="待发料" value="PENDING" />
                <el-option label="发料中" value="ISSUING" />
                <el-option label="已完成" value="COMPLETED" />
                <el-option label="已取消" value="CANCELLED" />
              </el-select>
            </el-form-item>
            <el-form-item label="发料类型" prop="issueType">
              <el-select v-model="queryParams.issueType" placeholder="全部" clearable style="width: 120px">
                <el-option label="正常" value="NORMAL" />
                <el-option label="紧急" value="EMERGENCY" />
              </el-select>
            </el-form-item>
            <el-form-item label="领料人" prop="receiverName">
              <el-input v-model="queryParams.receiverName" placeholder="领料人姓名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
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
            <el-button type="primary" plain icon="Plus" @click="openEmergencyDialog" v-hasPermi="['wms:materialIssue:emergency']">紧急建单</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:materialIssue:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="materialIssueList">
        <el-table-column label="发料单号" align="center" prop="issueNo" min-width="140">
          <template #default="{ row }">
            <el-link type="primary" @click="openIssueProcess(row.id)">{{ row.issueNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="工单号" align="center" prop="workOrderNo" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" align="center" prop="issueStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.issueStatus)" size="small">{{ statusLabel(row.issueStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" align="center" prop="issueType" width="90">
          <template #default="{ row }">
            <el-tag :type="row.issueType === 'EMERGENCY' ? 'danger' : 'info'" size="small">
              {{ row.issueType === 'EMERGENCY' ? '紧急' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="项数/数量" align="center" width="120">
          <template #default="{ row }">{{ row.totalItems }} / {{ row.totalQuantity }}</template>
        </el-table-column>
        <el-table-column label="领料人" align="center" prop="receiverName" width="100" />
        <el-table-column label="领料部门" align="center" prop="receiverDept" width="120" show-overflow-tooltip />
        <el-table-column label="发料时间" align="center" prop="issueTime" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.issueTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" align="center" prop="confirmTime" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.confirmTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openIssueProcess(row.id)" v-hasPermi="['wms:materialIssue:query']">领料</el-button>
            <el-button
              v-if="row.issueStatus === 'COMPLETED'"
              link
              type="success"
              @click="handleSyncSap(row.id)"
              v-hasPermi="['wms:materialIssue:syncSap']"
            >SAP</el-button>
            <el-button
              v-if="row.issueStatus === 'PENDING'"
              link
              type="danger"
              @click="handleDelete(row)"
              v-hasPermi="['wms:materialIssue:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" @success="getList" />

    <el-dialog v-model="emergencyVisible" title="紧急建发料单" width="480px" append-to-body>
      <el-form ref="emergencyFormRef" :model="emergencyForm" :rules="emergencyRules" label-width="100px">
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="emergencyForm.workOrderNo" placeholder="工单号" />
        </el-form-item>
        <el-form-item label="领料人" prop="receiverName">
          <el-input v-model="emergencyForm.receiverName" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="emergencyForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="emergencyVisible = false">取消</el-button>
        <el-button type="primary" :loading="emergencyLoading" @click="submitEmergency">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MaterialIssue" lang="ts">
import { listMaterialIssue, delMaterialIssue, createMaterialIssueFromWorkOrder, syncMaterialIssueSap } from '@/api/wms/materialIssue';
import { MaterialIssueVO, MaterialIssueQuery } from '@/api/wms/materialIssue/types';
import IssueProcessDrawer from './components/IssueProcessDrawer.vue';
import { useUserStore } from '@/store/modules/user';
import { useRoute } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const userStore = useUserStore();

const materialIssueList = ref<MaterialIssueVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();

const issueDrawerVisible = ref(false);
const statusTab = ref('');
const currentIssueId = ref<number | string | null>(null);

const emergencyVisible = ref(false);
const emergencyLoading = ref(false);
const emergencyFormRef = ref<ElFormInstance>();
const emergencyForm = reactive({
  workOrderNo: '',
  receiverId: '' as string | number,
  receiverName: '',
  remark: ''
});
const emergencyRules = {
  workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }]
};

const queryParams = ref<MaterialIssueQuery>({
  pageNum: 1,
  pageSize: 10,
  issueNo: undefined,
  workOrderNo: undefined,
  issueStatus: undefined,
  issueType: undefined,
  receiverName: undefined
});

const statusLabel = (s: string) => {
  const m: Record<string, string> = { PENDING: '待发料', ISSUING: '发料中', COMPLETED: '已完成', CANCELLED: '已取消' };
  return m[s] || s;
};
const statusTag = (s: string) => {
  const m: Record<string, string> = { PENDING: 'info', ISSUING: 'warning', COMPLETED: 'success', CANCELLED: 'danger' };
  return m[s] || 'info';
};

const getList = async () => {
  loading.value = true;
  const res = await listMaterialIssue(queryParams.value);
  materialIssueList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const onStatusTabChange = (name: string) => {
  queryParams.value.issueStatus = name || undefined;
  handleQuery();
};

const openIssueProcess = (id: number | string) => {
  currentIssueId.value = id;
  issueDrawerVisible.value = true;
};

const openEmergencyDialog = () => {
  emergencyForm.workOrderNo = '';
  emergencyForm.receiverId = userStore.userId;
  emergencyForm.receiverName = userStore.nickname;
  emergencyForm.remark = '';
  emergencyVisible.value = true;
};

const submitEmergency = () => {
  emergencyFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    emergencyLoading.value = true;
    try {
      const res = await createMaterialIssueFromWorkOrder({ ...emergencyForm });
      proxy?.$modal.msgSuccess('创建成功');
      emergencyVisible.value = false;
      await getList();
      if (res.data) openIssueProcess(res.data);
    } finally {
      emergencyLoading.value = false;
    }
  });
};

const handleDelete = async (row: MaterialIssueVO) => {
  await proxy?.$modal.confirm(`确认删除发料单 ${row.issueNo}？`);
  await delMaterialIssue(row.id);
  proxy?.$modal.msgSuccess('删除成功');
  getList();
};

const handleExport = () => {
  proxy?.download('wms/materialIssue/export', { ...queryParams.value }, `materialIssue_${Date.now()}.xlsx`);
};

const handleSyncSap = async (id: number | string) => {
  const res = await syncMaterialIssueSap(id);
  proxy?.$modal.msgSuccess(res.data?.message || '已提交SAP同步');
};

onMounted(() => {
  getList();
  const issueId = route.query.issueId;
  if (issueId) openIssueProcess(issueId as string);
});
</script>
