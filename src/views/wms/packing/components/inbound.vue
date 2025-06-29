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
      <el-tab-pane label="待接收" name="pendingInbound"> </el-tab-pane>
      <el-tab-pane label="已接收" name="warehouseReceive"> </el-tab-pane>
    </el-tabs>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="24" class="mb8">
          <el-col v-if="tabActiveName == 'pendingInbound'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="danger" plain icon="RefreshLeft" :disabled="multiple" @click="handleRejectPacking()">信息不一致-退回</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'pendingInbound'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="CircleCheck" :disabled="multiple" @click="handleBatchReceivePacking()">信息一致-接收</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:packing:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
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
        <el-table-column label="目的仓库" align="center" prop="warehouseCode">
          <template #default="scope">
            <span v-if="scope.row.warehouseCode">{{ `${scope.row.warehouseCode} - ${scope.row.warehouseDesc}` }}</span>
            <span v-else></span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_packing_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="tabActiveName == 'pendingInbound'" content="退回" placement="top">
              <el-button v-hasPermi="['wms:packing:edit']" link type="danger" icon="RefreshLeft" @click="handleRejectPacking(scope.row)">退回</el-button>
            </el-tooltip>
            <el-tooltip content="入库" placement="top" v-if="tabActiveName == 'pendingInbound'">
              <el-button v-hasPermi="['wms:packing:edit']" link type="success" icon="CircleCheck" @click="handleReceivePacking(scope.row)">接收</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改打包记录对话框 -->
    <PackingDialog ref="packingRef" />

    <!-- 确认接收对话框 -->
    <el-dialog v-model="visible" :title="title" width="60%" append-to-body>
      <el-form ref="packingFormRef" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="打包编号">
              <el-text> {{ form.packingCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="栈板编号">
              <el-text> {{ form.palletCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="目的仓库" prop="warehouseCode">
              <el-select v-model="form.warehouseCode" placeholder="请选择目的仓库" clearable filterable>
                <el-option v-for="warehouse in warehouseLocationList" :key="warehouse.code" :label="`${warehouse.code}-${warehouse.name}`" :value="warehouse.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitInbound">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Packing" lang="ts">
import { listPacking, delPacking, rejectPacking, receivePacking, inBoundPending } from '@/api/wms/packing';
import { PackingVO, PackingQuery, PackingForm } from '@/api/wms/packing/types';
import PackingDialog from '@/views/wms/packing/components/packingDialog.vue';
const packingRef = ref<InstanceType<typeof PackingDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_packing_status, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_packing_status', 'wms_work_order_check_enable'));
import useDialog from '@/hooks/useDialog';
import { WarehouseLocationVO } from '@/api/wms/warehouseLocation/types';
import { listWarehouseLocation } from '@/api/wms/warehouseLocation';
const tabActiveName = ref('pendingInbound');
const packingList = ref<PackingVO[]>([]);
const checkedPackingList = ref<PackingVO[]>([]);
const loading = ref(true);
const buttonLoading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const palletCodeList = ref<Array<string | number>>([]);
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
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
/** 查询打包记录列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.status = null;
  if (tabActiveName.value == 'pendingInbound') {
    queryParams.value.status = 2;
  } else if (tabActiveName.value == 'warehouseReceive') {
    queryParams.value.status = 3;
  }
  const res = await listPacking(queryParams.value);
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
  [ids.value, palletCodeList.value] = selection.reduce(
    (acc, { id, palletCode }) => {
      acc[0].push(id);
      acc[1].push(palletCode);
      return acc;
    },
    [[], []]
  );
  checkedPackingList.value = selection;
  single.value = selection.length != 1;
  multiple.value = !selection.length;
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

/** 送仓信息不一致按钮操作 */
const handleRejectPacking = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  const palletCodes = row?.palletCode || palletCodeList.value;
  await proxy?.$modal.confirm('确认是否回退栈板编号为"' + palletCodes + '"的数据项？').finally(() => (loading.value = false));
  await rejectPacking(_ids);
  proxy?.$modal.msgSuccess('回退成功');
  await getList();
};

/**  送仓信息一致确认按钮操作 */
const handleBatchReceivePacking = async (row?: PackingVO) => {
  const palletCodes = row?.palletCode || palletCodeList.value;
  await proxy?.$modal.confirm('确认是否接收栈板编号为"' + palletCodes + '"的数据项？').finally(() => (loading.value = false));
  await receivePacking({ packingBoList: checkedPackingList.value });
  proxy?.$modal.msgSuccess('接收成功');
  await getList();
};
/** 送仓信息一致确认按钮操作 */
const handleReceivePacking = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  visible.value = true;
  await getWarehouseList();
  form.value = row;
};

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '库存接收'
});

/** 查询仓位信息列表 */
const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
const getWarehouseList = async () => {
  const res = await listWarehouseLocation({
    parentId: 0
  });
  warehouseLocationList.value = res.data;
};

/** 信息一致确认按钮操作 */
const submitInbound = () => {
  packingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await receivePacking({
          packingBoList: [
            {
              id: form.value.id,
              warehouseCode: form.value.warehouseCode
            }
          ]
        }).finally(() => (buttonLoading.value = false));
      }
      visible.value = false;
      proxy?.$modal.msgSuccess('送仓成功');
      await getList();
    }
  });
};
onMounted(() => {
  getList();
});
</script>
