<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="检验单号" prop="checkNo">
              <el-input v-model="queryParams.checkNo" placeholder="请输入检验单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库单号" prop="receiptOrderNo">
              <el-input v-model="queryParams.receiptOrderNo" placeholder="请输入入库单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入物料描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="开始条码" prop="startSfc">
              <el-input v-model="queryParams.startSfc" placeholder="请输入开始条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="结束条码" prop="endSfc">
              <el-input v-model="queryParams.endSfc" placeholder="请输入结束条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="质检人" prop="checkUser">
              <el-input v-model="queryParams.checkUser" placeholder="请输入质检人" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="质检时间" prop="checkTime">
              <el-date-picker v-model="queryParams.checkTime" clearable type="date" value-format="YYYY-MM-DD" placeholder="请选择质检时间" />
            </el-form-item>
            <el-form-item label="质检结果" prop="result">
              <DictRadio v-model="queryParams.result" :radio-data="wms_check_result" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
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
            <el-button v-hasPermi="['wms:recCheck:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheck:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheck:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:recCheck:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table :key="tableKey" v-loading="loading" :data="recCheckList" row-key="id" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="检验单号" align="center" prop="checkNo">
          <template #default="scope">
            <router-link :to="'/wms/check/checkDetail/index/' + scope.row.checkNo" class="link-type">
              <span>{{ scope.row.checkNo }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[1].visible" label="入库单号" align="center" prop="receiptOrderNo" />
        <el-table-column v-if="columns[2].visible" label="工单号" align="center" prop="shopOrder" />
        <el-table-column v-if="columns[3].visible" label="物料" align="center" prop="item" />
        <el-table-column v-if="columns[4].visible" label="物料描述" align="center" prop="itemDesc" />
        <el-table-column v-if="columns[5].visible" label="开始条码" align="center" prop="startSfc" />
        <el-table-column v-if="columns[6].visible" label="结束条码" align="center" prop="endSfc" />
        <el-table-column v-if="columns[7].visible" label="质检人" align="center" prop="checkUser" />
        <el-table-column v-if="columns[8].visible" label="质检时间" align="center" prop="checkTime">
          <template #default="scope">
            <span>{{ parseTime(scope.row.checkTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[9].visible" label="检验数量" align="center" prop="checkQuantity" />
        <el-table-column v-if="columns[10].visible" label="抽样数量" align="center" prop="samplingQuantity" />
        <el-table-column v-if="columns[11].visible" label="质检结果" align="center" prop="result">
          <template #default="scope">
            <dict-tag :options="wms_check_result" :value="scope.row.result" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[12].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:recCheck:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:recCheck:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改收货检验单对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body>
      <el-form ref="recCheckFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="检验单号" prop="checkNo">
          <el-input v-model="form.checkNo" placeholder="请输入检验单号" />
        </el-form-item>
        <el-form-item label="入库单号" prop="receiptOrderNo">
          <el-input v-model="form.receiptOrderNo" placeholder="请输入入库单号" />
        </el-form-item>
        <el-form-item label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="物料" prop="item">
          <el-input v-model="form.item" placeholder="请输入物料" />
        </el-form-item>
        <el-form-item label="物料描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入物料描述" />
        </el-form-item>
        <el-form-item label="开始条码" prop="startSfc">
          <el-input v-model="form.startSfc" placeholder="请输入开始条码" />
        </el-form-item>
        <el-form-item label="结束条码" prop="endSfc">
          <el-input v-model="form.endSfc" placeholder="请输入结束条码" />
        </el-form-item>
        <el-form-item label="质检人" prop="checkUser">
          <el-input v-model="form.checkUser" placeholder="请输入质检人" />
        </el-form-item>
        <el-form-item label="质检时间" prop="checkTime">
          <el-date-picker v-model="form.checkTime" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择质检时间" style="min-width: 50%">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="检验数量" prop="checkQuantity">
          <el-input-number v-model="form.checkQuantity" :min="0" controls-position="right" placeholder="请输入检验批数量" style="min-width: 50%" />
        </el-form-item>
        <el-form-item label="抽样数量" prop="samplingQuantity">
          <el-input-number v-model="form.samplingQuantity" :min="0" controls-position="right" placeholder="请输入抽样数量" style="min-width: 50%" />
        </el-form-item>
        <el-form-item label="质检结果" prop="result">
          <el-radio-group v-model="form.result">
            <el-radio v-for="dict in wms_check_result" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RecCheck" lang="ts">
import { listRecCheck, getRecCheck, delRecCheck, addRecCheck, updateRecCheck } from '@/api/wms/recCheck';
import { RecCheckVO, RecCheckQuery, RecCheckForm } from '@/api/wms/recCheck/types';
import { TableColumns } from '@/api/types';
import { ref } from 'vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_check_result } = toRefs<any>(proxy?.useDict('wms_check_result'));
const tableKey = ref(1);
// 创建响应式数组对象
const columns = ref<TableColumns[]>([
  { key: 1, label: '检验单号', visible: true },
  { key: 2, label: '入库单号', visible: true },
  { key: 3, label: '工单号', visible: true },
  { key: 4, label: '物料', visible: true },
  { key: 5, label: '物料描述', visible: true },
  { key: 6, label: '开始条码', visible: true },
  { key: 7, label: '结束条码', visible: true },
  { key: 8, label: '质检人', visible: true },
  { key: 9, label: '质检时间', visible: true },
  { key: 10, label: '检验数量', visible: true },
  { key: 11, label: '抽样数量', visible: true },
  { key: 12, label: '质检结果', visible: true },
  { key: 13, label: '备注', visible: true }
]);
watch(
  columns,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);
const recCheckList = ref<RecCheckVO[]>([]);

const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const recCheckFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: RecCheckForm = {
  id: undefined,
  checkNo: undefined,
  receiptOrderNo: undefined,
  shopOrder: undefined,
  item: undefined,
  itemDesc: undefined,
  startSfc: undefined,
  endSfc: undefined,
  checkUser: undefined,
  checkTime: undefined,
  checkQuantity: undefined,
  samplingQuantity: undefined,
  result: null,
  remark: undefined
};
const data = reactive<PageData<RecCheckForm, RecCheckQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    checkNo: undefined,
    receiptOrderNo: undefined,
    shopOrder: undefined,
    item: undefined,
    itemDesc: undefined,
    startSfc: undefined,
    endSfc: undefined,
    checkUser: undefined,
    checkTime: undefined,
    checkQuantity: undefined,
    samplingQuantity: undefined,
    result: null,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    checkNo: [{ required: true, message: '检验单号不能为空', trigger: 'blur' }],
    receiptOrderNo: [{ required: true, message: '入库单号不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '物料不能为空', trigger: 'blur' }],
    itemDesc: [{ required: true, message: '物料描述不能为空', trigger: 'blur' }],
    checkUser: [{ required: true, message: '质检人不能为空', trigger: 'blur' }],
    checkTime: [{ required: true, message: '质检时间不能为空', trigger: 'blur' }],
    checkQuantity: [{ required: true, message: '检验批数量不能为空', trigger: 'blur' }],
    samplingQuantity: [{ required: true, message: '抽样数量不能为空', trigger: 'blur' }],
    result: [{ required: true, message: '质检结果不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询收货检验单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listRecCheck(queryParams.value);
  recCheckList.value = res.rows;
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
  recCheckFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: RecCheckVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加收货检验单';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: RecCheckVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getRecCheck(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改收货检验单';
};

/** 提交按钮 */
const submitForm = () => {
  recCheckFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateRecCheck(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addRecCheck(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: RecCheckVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除收货检验单编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delRecCheck(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/recCheck/export',
    {
      ...queryParams.value
    },
    `recCheck_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
