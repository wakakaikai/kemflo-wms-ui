<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="公司名称" prop="companyName">
              <el-select v-model="queryParams.companyName" placeholder="请选择公司名称" clearable>
                <el-option v-for="dict in wms_company_name" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
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
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderSnList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="公司名称" align="center" prop="companyName" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="条码" align="center" prop="sn" />
        <el-table-column label="版本" align="center" prop="version">
          <template #default="scope">
            <el-tag v-if="scope.row.version" type="success">V{{ scope.row.version }}</el-tag>
            <el-tag v-else>--</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="qty" />
        <el-table-column label="产品品号" align="center" prop="item" />
        <el-table-column label="产品描述" align="center" prop="itemDesc" />
        <el-table-column label="生产线别" align="center" prop="productLine" />
        <el-table-column label="生产日期" align="center" prop="productDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
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
        <el-form-item label="条码" prop="sn">
          <span>{{ form.sn }}</span>
        </el-form-item>
        <el-form-item label="数量" prop="qty">
          <el-input-number v-model="form.qty" :precision="3" :max="form.plannedQty" placeholder="请输入数量" />
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
import WorkOrderSnReprintDialog from './components/workOrderSnReprintDialog.vue';
import { ref } from 'vue';
import { parseTime } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_company_name } = toRefs<any>(proxy?.useDict('wms_company_name'));

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

// 打印相关引用
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

const { queryParams, form, rules } = toRefs(data);
// 禁用未来的时间
const disabledFutureDate = (time: Date) => {
  // 获取当前时间，并将毫秒设为0以确保精确到秒
  const now = new Date();
  // 加上指定秒数（默认3秒）
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);

  // 禁止选择当前时间之后的日期
  return time.getTime() > now.getTime();
};
/** 查询工单条码列表 */
const getList = async () => {
  loading.value = true;
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
