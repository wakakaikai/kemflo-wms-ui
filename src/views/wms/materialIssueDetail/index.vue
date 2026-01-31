<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="发料单ID" prop="issueId">
              <el-input v-model="queryParams.issueId" placeholder="请输入发料单ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发料单号" prop="issueNo">
              <el-input v-model="queryParams.issueNo" placeholder="请输入发料单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="需求数量" prop="requiredQuantity">
              <el-input v-model="queryParams.requiredQuantity" placeholder="请输入需求数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="实发数量" prop="issuedQuantity">
              <el-input v-model="queryParams.issuedQuantity" placeholder="请输入实发数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="单位" prop="unit">
              <el-input v-model="queryParams.unit" placeholder="请输入单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发料时间" prop="issueTime">
              <el-date-picker clearable
                v-model="queryParams.issueTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择发料时间"
              />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:materialIssueDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:materialIssueDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:materialIssueDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:materialIssueDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="materialIssueDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="发料单ID" align="center" prop="issueId" />
        <el-table-column label="发料单号" align="center" prop="issueNo" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="物料编码" align="center" prop="materialCode" />
        <el-table-column label="批次号" align="center" prop="batchCode" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="需求数量" align="center" prop="requiredQuantity" />
        <el-table-column label="实发数量" align="center" prop="issuedQuantity" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="发料状态(PENDING-待发料, ISSUED-已发料)" align="center" prop="issueStatus" />
        <el-table-column label="发料时间" align="center" prop="issueTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.issueTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:materialIssueDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:materialIssueDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改发料明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="materialIssueDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="发料单ID" prop="issueId">
          <el-input v-model="form.issueId" placeholder="请输入发料单ID" />
        </el-form-item>
        <el-form-item label="发料单号" prop="issueNo">
          <el-input v-model="form.issueNo" placeholder="请输入发料单号" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>
        <el-form-item label="需求数量" prop="requiredQuantity">
          <el-input v-model="form.requiredQuantity" placeholder="请输入需求数量" />
        </el-form-item>
        <el-form-item label="实发数量" prop="issuedQuantity">
          <el-input v-model="form.issuedQuantity" placeholder="请输入实发数量" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="发料时间" prop="issueTime">
          <el-date-picker clearable
            v-model="form.issueTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择发料时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
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
  </div>
</template>

<script setup name="MaterialIssueDetail" lang="ts">
import { listMaterialIssueDetail, getMaterialIssueDetail, delMaterialIssueDetail, addMaterialIssueDetail, updateMaterialIssueDetail } from '@/api/wms/materialIssueDetail';
import { MaterialIssueDetailVO, MaterialIssueDetailQuery, MaterialIssueDetailForm } from '@/api/wms/materialIssueDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const materialIssueDetailList = ref<MaterialIssueDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const materialIssueDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: MaterialIssueDetailForm = {
  id: undefined,
  issueId: undefined,
  issueNo: undefined,
  workOrderNo: undefined,
  materialCode: undefined,
  batchCode: undefined,
  locationCode: undefined,
  requiredQuantity: undefined,
  issuedQuantity: undefined,
  unit: undefined,
  issueStatus: undefined,
  issueTime: undefined,
  remark: undefined,
}
const data = reactive<PageData<MaterialIssueDetailForm, MaterialIssueDetailQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    issueId: undefined,
    issueNo: undefined,
    workOrderNo: undefined,
    materialCode: undefined,
    batchCode: undefined,
    locationCode: undefined,
    requiredQuantity: undefined,
    issuedQuantity: undefined,
    unit: undefined,
    issueStatus: undefined,
    issueTime: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    issueId: [
      { required: true, message: "发料单ID不能为空", trigger: "blur" }
    ],
    issueNo: [
      { required: true, message: "发料单号不能为空", trigger: "blur" }
    ],
    workOrderNo: [
      { required: true, message: "工单号不能为空", trigger: "blur" }
    ],
    materialCode: [
      { required: true, message: "物料编码不能为空", trigger: "blur" }
    ],
    batchCode: [
      { required: true, message: "批次号不能为空", trigger: "blur" }
    ],
    locationCode: [
      { required: true, message: "库位编码不能为空", trigger: "blur" }
    ],
    requiredQuantity: [
      { required: true, message: "需求数量不能为空", trigger: "blur" }
    ],
    issuedQuantity: [
      { required: true, message: "实发数量不能为空", trigger: "blur" }
    ],
    unit: [
      { required: true, message: "单位不能为空", trigger: "blur" }
    ],
    issueStatus: [
      { required: true, message: "发料状态(PENDING-待发料, ISSUED-已发料)不能为空", trigger: "change" }
    ],
    issueTime: [
      { required: true, message: "发料时间不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询发料明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMaterialIssueDetail(queryParams.value);
  materialIssueDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  materialIssueDetailFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: MaterialIssueDetailVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加发料明细";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: MaterialIssueDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getMaterialIssueDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改发料明细";
}

/** 提交按钮 */
const submitForm = () => {
  materialIssueDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateMaterialIssueDetail(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addMaterialIssueDetail(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: MaterialIssueDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除发料明细编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delMaterialIssueDetail(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/materialIssueDetail/export', {
    ...queryParams.value
  }, `materialIssueDetail_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
