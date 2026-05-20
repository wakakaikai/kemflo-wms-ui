<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="报工ID" prop="reportId">
              <el-input v-model="queryParams.reportId" placeholder="请输入报工ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="停机开始时间" prop="shutdownStartTime">
              <el-date-picker clearable v-model="queryParams.shutdownStartTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择停机开始时间" />
            </el-form-item>
            <el-form-item label="停机结束时间" prop="shutdownEndTime">
              <el-date-picker clearable v-model="queryParams.shutdownEndTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择停机结束时间" />
            </el-form-item>
            <el-form-item label="停机原因" prop="shutdownReason">
              <el-input v-model="queryParams.shutdownReason" placeholder="请输入停机原因" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrderReportAbnormalTime:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrderReportAbnormalTime:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrderReportAbnormalTime:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderReportAbnormalTime:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderReportAbnormalTimeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="报工ID" align="center" prop="reportId" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="停机开始时间" align="center" prop="shutdownStartTime" width="180" />
        <el-table-column label="停机结束时间" align="center" prop="shutdownEndTime" width="180" />
        <el-table-column label="停机大类" align="center" prop="abnormalClass" />
        <el-table-column label="停机类型" align="center" prop="abnormalType" />
        <el-table-column label="停机原因" align="center" prop="shutdownReason">
          <template #default="scope">
            <dict-tag :options="mes_shutdown_reason" :value="scope.row.shutdownReason" />
          </template>
        </el-table-column>
        <el-table-column label="停机时长" align="center" prop="shutdownDuration" />
        <el-table-column label="有效停机时长" align="center" prop="effectiveShutdownDuration" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrderReportAbnormalTime:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrderReportAbnormalTime:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单报工异常时间明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderReportAbnormalTimeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="报工ID" prop="reportId">
          <el-input v-model="form.reportId" placeholder="请输入报工ID" />
        </el-form-item>
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
        </el-form-item>
        <el-form-item label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="停机开始时间" prop="shutdownStartTime">
          <el-date-picker clearable v-model="form.shutdownStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择停机开始时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="停机结束时间" prop="shutdownEndTime">
          <el-date-picker clearable v-model="form.shutdownEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择停机结束时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="停机大类" prop="abnormalClass">
          <el-input v-model="form.abnormalClass" placeholder="请输入停机大类" />
        </el-form-item>
        <el-form-item label="停机原因" prop="shutdownReason">
          <el-input v-model="form.shutdownReason" placeholder="请输入停机原因" />
        </el-form-item>
        <el-form-item label="例外时间ID" prop="abnormalId">
          <el-input v-model="form.abnormalId" placeholder="请输入例外时间ID" />
        </el-form-item>
        <el-form-item label="停机时长" prop="shutdownDuration">
          <el-input v-model="form.shutdownDuration" placeholder="请输入停机时长" />
        </el-form-item>
        <el-form-item label="有效停机时长" prop="effectiveShutdownDuration">
          <el-input v-model="form.effectiveShutdownDuration" placeholder="请输入有效停机时长" />
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

<script setup name="ShopOrderReportAbnormalTime" lang="ts">
import {
  listShopOrderReportAbnormalTime,
  getShopOrderReportAbnormalTime,
  delShopOrderReportAbnormalTime,
  addShopOrderReportAbnormalTime,
  updateShopOrderReportAbnormalTime
} from '@/api/mes/shopOrderReportAbnormalTime';
import { ShopOrderReportAbnormalTimeVO, ShopOrderReportAbnormalTimeQuery, ShopOrderReportAbnormalTimeForm } from '@/api/mes/shopOrderReportAbnormalTime/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_shutdown_reason } = toRefs<any>(proxy?.useDict('mes_shutdown_reason'));
const shopOrderReportAbnormalTimeList = ref<ShopOrderReportAbnormalTimeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderReportAbnormalTimeFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShopOrderReportAbnormalTimeForm = {
  id: undefined,
  reportId: undefined,
  workCenter: undefined,
  shopOrder: undefined,
  shutdownStartTime: undefined,
  shutdownEndTime: undefined,
  abnormalClass: undefined,
  abnormalType: undefined,
  shutdownReason: undefined,
  abnormalId: undefined,
  shutdownDuration: undefined,
  effectiveShutdownDuration: undefined
};
const data = reactive<PageData<ShopOrderReportAbnormalTimeForm, ShopOrderReportAbnormalTimeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    reportId: undefined,
    workCenter: undefined,
    shopOrder: undefined,
    shutdownStartTime: undefined,
    shutdownEndTime: undefined,
    abnormalClass: undefined,
    abnormalType: undefined,
    shutdownReason: undefined,
    abnormalId: undefined,
    shutdownDuration: undefined,
    effectiveShutdownDuration: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单报工异常时间明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShopOrderReportAbnormalTime(queryParams.value);
  shopOrderReportAbnormalTimeList.value = res.rows;
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
  shopOrderReportAbnormalTimeFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShopOrderReportAbnormalTimeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单报工异常时间明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderReportAbnormalTimeVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrderReportAbnormalTime(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单报工异常时间明细';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderReportAbnormalTimeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrderReportAbnormalTime(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrderReportAbnormalTime(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderReportAbnormalTimeVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单报工异常时间明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrderReportAbnormalTime(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderReportAbnormalTime/export',
    {
      ...queryParams.value
    },
    `shopOrderReportAbnormalTime_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
