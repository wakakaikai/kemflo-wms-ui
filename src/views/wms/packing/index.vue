<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mt-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="打包编号" prop="packingCode">
              <el-input v-model="queryParams.packingCode" placeholder="请输入打包编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="目的仓库" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入目的仓库" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>
    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane label="全部" name="all"> </el-tab-pane>
      <el-tab-pane label="待产线送库" name="waitInStore"> </el-tab-pane>
      <el-tab-pane label="待入库接收" name="pendingInbound"> </el-tab-pane>
      <el-tab-pane label="已接收" name="warehouseReceive"> </el-tab-pane>
    </el-tabs>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="24" class="mb8">
          <el-col v-if="tabActiveName == 'all'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:add']" type="success" plain icon="ShoppingCart" :disabled="multiple" @click="handlePendingInbound()">送仓</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'pendingInbound'" :span="1.5">
            <el-button v-hasPermi="['wms:pallet:remove']" type="danger" plain icon="RefreshLeft" :disabled="multiple" @click="handleInboundBack()">信息不一致-退回</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'pendingInbound'" :span="1.5">
            <el-button v-hasPermi="['wms:pallet:edit']" type="success" plain icon="CircleCheck" :disabled="multiple" @click="handleInbound()">信息一致-入库</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="packingList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.packingDetailVoList" style="width: calc(100% - 110px); float: right; margin: 10px 0" empty-text="暂无数据">
              <el-table-column label="工单号" align="center" width="130" prop="workOrderNo" />
              <el-table-column label="产品料号" align="center" width="150" prop="item" />
              <el-table-column label="产品描述" align="left" prop="itemDesc" />
              <el-table-column label="计划数量" align="center" width="130" prop="plannedQty" />
              <el-table-column label="已交货数量" align="center" width="130" prop="deliveredQty" />
              <el-table-column label="待入库数量" align="center" width="130" prop="waitStockQty" />
              <el-table-column label="打包数量" align="center" width="130" prop="packingQty" />
              <el-table-column label="入库检" prop="checkEnable" width="120" align="center">
                <template #default="scope">
                  <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="打包编号" align="center" prop="packingCode" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="目的仓库" align="center" prop="warehouseCode" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_packing_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:packing:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:packing:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改打包记录对话框 -->
    <PackingDialog ref="packingRef" />
  </div>
</template>

<script setup name="Packing" lang="ts">
import { listPackingAndDetail, delPacking } from '@/api/wms/packing';
import { PackingVO, PackingQuery, PackingForm } from '@/api/wms/packing/types';
import PackingDialog from '@/views/wms/packing/components/packingDialog.vue';
const packingRef = ref<InstanceType<typeof PackingDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_packing_status, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_packing_status', 'wms_work_order_check_enable'));
const tabActiveName = ref('all');
const packingList = ref<PackingVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const packingFormRef = ref<ElFormInstance>();

const initFormData: PackingForm = {
  id: undefined,
  packingCode: undefined,
  palletCode: undefined,
  warehouseCode: undefined,
  status: undefined,
  remark: undefined,
  packingDetailBoList: undefined
};

const data = reactive<PageData<PackingForm, PackingQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    packingCode: undefined,
    palletCode: undefined,
    warehouseCode: undefined,
    status: undefined,
    packingDetailBoList: [],
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    // packingCode: [{ required: true, message: '打包编号不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }]
    // warehouseCode: [{ required: true, message: '目的仓库不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询打包记录列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.status = null;
  if (tabActiveName.value == 'waitInStore') {
    queryParams.value.status = 1;
  } else if (tabActiveName.value == 'pendingInbound') {
    queryParams.value.status = 2;
  } else if (tabActiveName.value == 'warehouseReceive') {
    queryParams.value.status = 3;
  }
  const res = await listPackingAndDetail(queryParams.value);
  packingList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  packingFormRef.value?.resetFields();
};
const changeTab = (activeName: any) => {
  handleQuery();
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
const handleSelectionChange = (selection: PackingVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  packingRef.value.openDialog();
  packingRef.value?.initPackingDialog(null);
};

/** 修改按钮操作 */
const handleUpdate = (row?: PackingVO) => {
  const _id = row?.id || ids.value[0];
  packingRef.value.openDialog();
  packingRef.value?.initPackingDialog(_id);
};

/** 删除按钮操作 */
const handleDelete = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除打包记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delPacking(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/packing/export',
    {
      ...queryParams.value
    },
    `packing_${new Date().getTime()}.xlsx`
  );
};

/** 送仓按钮操作 */
const handlePendingInbound = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  proxy?.$modal.msgSuccess('送仓成功');
  await getList();
};

/** 送仓信息不一致按钮操作 */
const handleInboundBack = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  proxy?.$modal.msgSuccess('送仓成功');
  await getList();
};

/** 送仓信息一致确认按钮操作 */
const handleInbound = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  proxy?.$modal.msgSuccess('送仓成功');
  await getList();
};

onMounted(() => {
  getList();
});
</script>
