<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="条码" prop="sn">
              <el-input v-model="queryParams.sn" placeholder="请输入条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产线别" prop="productLine">
              <el-input v-model="queryParams.productLine" placeholder="请输入生产线别" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker clearable v-model="queryParams.productDate" type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择生产日期" />
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
          <!--          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderSn:add']">新增</el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderSn:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderSn:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderSn:export']">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrderSn:print']" color="#626aef" plain icon="Printer" @click="handlePrintDialog" :disabled="multiple">补打印</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderSnList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="公司名称" align="left" prop="companyName" show-overflow-tooltip />
        <el-table-column v-if="columns[1].visible" label="栈板号" align="center" prop="palletCode" />
        <el-table-column v-if="columns[2].visible" label="打包号" align="center" prop="packingCode" />
        <el-table-column v-if="columns[3].visible" label="工单号" align="center" prop="workOrderNo" min-width="130" />
        <el-table-column v-if="columns[4].visible" label="标签码" align="center" prop="sn" min-width="130" />
        <el-table-column v-if="columns[5].visible" label="版本" align="center" prop="version">
          <template #default="scope">
            <el-tag v-if="scope.row.version" type="success">V{{ scope.row.version }}</el-tag>
            <el-tag v-else>--</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[6].visible" label="数量" align="center" prop="qty" />
        <el-table-column v-if="columns[7].visible" label="产品品号" align="center" prop="item" min-width="150" />
        <el-table-column v-if="columns[8].visible" label="产品描述" align="left" prop="itemDesc" show-overflow-tooltip min-width="300" />
        <el-table-column v-if="columns[9].visible" label="生产线别" align="center" prop="productLine" />
        <el-table-column v-if="columns[10].visible" label="生产日期" align="center" prop="productDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[11].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[12].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[13].visible" label="更新时间" align="center" prop="updateTime" />
        <el-table-column v-if="columns[14].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column v-if="columns[15].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderSn:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderSn:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改工单条码对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderSnFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="公司名称" prop="companyName">
          <span>{{ form.companyName }}</span>
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <span>{{ form.workOrderNo }}</span>
        </el-form-item>
        <el-form-item label="标签码" prop="sn">
          <span>{{ form.sn }}</span>
        </el-form-item>
        <el-form-item label="数量" prop="qty">
          <el-input-number v-model="form.qty" :precision="3" :max="form.plannedQty" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <span>10*6+1*3(10整箱*6PCS 1尾箱*3PCS)</span>
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 补打印确认对话框 -->
    <WorkOrderSnReprintDialog v-model="printDialogVisible" :selected-records="selectedRecords" />
  </div>
</template>

<script setup name="WorkOrderSn" lang="ts">
import { listWorkOrderSn, getWorkOrderSn, delWorkOrderSn, addWorkOrderSn, updateWorkOrderSn } from '@/api/wms/workOrderSn';
import { WorkOrderSnVO, WorkOrderSnQuery, WorkOrderSnForm } from '@/api/wms/workOrderSn/types';
import WorkOrderSnReprintDialog from '@/views/wms/workOrderSn/components/workOrderSnReprintDialog.vue';
import { parseTime } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderSnList = ref<WorkOrderSnVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderSnFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const props = defineProps({
  workOrderNo: {
    type: String,
    required: true
  }
});

const printDialogVisible = ref(false);
const selectedRecords = ref<WorkOrderSnVO[]>([]);

const initFormData: WorkOrderSnForm = {
  id: undefined,
  companyName: undefined,
  workOrderNo: undefined,
  sn: undefined,
  qty: undefined,
  sequence: undefined,
  productLine: undefined,
  productDate: undefined,
  status: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderSnForm, WorkOrderSnQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    companyName: undefined,
    workOrderNo: undefined,
    sn: undefined,
    qty: undefined,
    sequence: undefined,
    productLine: undefined,
    productDate: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    qty: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
  }
});

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `公司名称`, visible: false, children: [] },
  { key: 1, label: `栈板号`, visible: false, children: [] },
  { key: 2, label: `打包号`, visible: false, children: [] },
  { key: 3, label: `工单号`, visible: true, children: [] },
  { key: 4, label: `标签码`, visible: true, children: [] },
  { key: 5, label: `版本`, visible: true, children: [] },
  { key: 6, label: `数量`, visible: true, children: [] },
  { key: 7, label: `产品品号`, visible: true, children: [] },
  { key: 8, label: `产品描述`, visible: true, children: [] },
  { key: 9, label: `生产线别`, visible: true, children: [] },
  { key: 10, label: `生产日期`, visible: true, children: [] },
  { key: 11, label: `创建时间`, visible: false, children: [] },
  { key: 12, label: `创建者`, visible: false, children: [] },
  { key: 13, label: `更新时间`, visible: false, children: [] },
  { key: 14, label: `更新者`, visible: false, children: [] },
  { key: 15, label: `备注`, visible: true, children: [] }
]);

const { queryParams, form, rules } = toRefs(data);

/** 查询工单条码列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.workOrderNo = props.workOrderNo;
  const res = await listWorkOrderSn(queryParams.value);
  workOrderSnList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderSnFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: WorkOrderSnVO[]) => {
  ids.value = selection.map((item) => item.id);
  selectedRecords.value = selection;
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单条码';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderSnVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrderSn(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单条码';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderSnFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderSn(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrderSn(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderSnVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单条码编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrderSn(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderSn/export',
    {
      ...queryParams.value
    },
    `workOrderSn_${new Date().getTime()}.xlsx`
  );
};

// 显示打印对话框
const handlePrintDialog = () => {
  if (selectedRecords.value.length === 0) {
    proxy?.$modal.msgWarning('请至少选择一条记录进行打印');
    return;
  }
  printDialogVisible.value = true;
};

onMounted(() => {
  getList();
});
</script>
