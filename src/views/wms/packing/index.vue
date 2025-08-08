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
            <el-form-item label="操作时间" prop="dateTimeRange">
              <el-date-picker
                v-model="queryParams.dateTimeRange"
                type="datetimerange"
                :shortcuts="shortcuts"
                value-format="YYYY-MM-DD HH:mm:ss"
                range-separator="-"
                start-placeholder="请选择开始日期"
                end-placeholder="请选择结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
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

    <!--    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane label="全部" name="all"> </el-tab-pane>
      <el-tab-pane label="待产线送库" name="waitInStore"> </el-tab-pane>
      <el-tab-pane label="待入库接收" name="pendingInbound"> </el-tab-pane>
      <el-tab-pane label="已驳回" name="warehouseReject"> </el-tab-pane>
      <el-tab-pane label="SAP同步异常" name="warehouseFailed"> </el-tab-pane>
    </el-tabs>-->

    <!-- 打包列表Tab标签页 -->
    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane name="all">
        <template #label>
          <el-badge :value="allCount" class="item" color="#67c23a" :offset="[10, 0]" :max="9999999999">
            <span>全部</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="waitInStore">
        <template #label>
          <el-badge :value="waitInStoreCount" class="item" color="#409EFF" :offset="[10, 0]" :max="9999999999">
            <span>待产线送库</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="pendingInbound">
        <template #label>
          <el-badge :value="pendingInboundCount" class="item" color="#e6a23c" :offset="[10, 0]" :max="9999999999">
            <span>待入库接收</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="warehouseReject">
        <template #label>
          <el-badge :value="warehouseRejectCount" class="item" color="#f56c6c" :offset="[10, 0]" :max="9999999999">
            <span>已退回</span>
          </el-badge>
        </template>
      </el-tab-pane>
      <!--      <el-tab-pane name="warehouseFailed">
        <template #label>
          <el-badge :value="warehouseFailedCount" class="item" color="#f56c6c" :offset="[10, 0]">
            <span>SAP同步异常</span>
          </el-badge>
        </template>
      </el-tab-pane>-->
    </el-tabs>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="24" class="mb8">
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:add']" type="primary" plain icon="Plus" @click="handleScanAdd">扫码新增</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleScanUpdate()">扫码修改</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>

          <el-col v-if="tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="ShoppingCart" :disabled="multiple" @click="handleMultiPendingInbound()">送仓</el-button>
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
              <el-table-column label="序号" align="center" width="60">
                <template #default="{ $index }">
                  {{ $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="工单号" align="center" width="130" prop="workOrderNo" />
              <el-table-column label="条码" align="center" width="130" prop="sn" />
              <el-table-column label="产品料号" align="center" width="150" prop="item" />
              <el-table-column label="产品描述" align="left" prop="itemDesc" />
              <el-table-column label="计划数量" align="center" width="130" prop="plannedQty" />
              <el-table-column label="打包数量" align="center" width="130" prop="packingQty" />
              <el-table-column label="入库检" prop="checkEnable" width="120" align="center">
                <template #default="scope">
                  <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
                </template>
              </el-table-column>
              <el-table-column label="备注" align="left" prop="remark" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="打包编号" align="left" prop="packingCode" />
        <el-table-column label="栈板编号" align="left" prop="palletCode" />
        <el-table-column label="目的仓库" align="left" prop="warehouseCode">
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
        <el-table-column label="项次数" align="left" prop="countPackingDetail">
          <template #default="scope">
            <span>{{ (scope.row.packingDetailVoList || []).length }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="创建者" align="center" prop="createByName" />
        <el-table-column label="更新时间" align="center" prop="updateTime" />
        <el-table-column label="更新者" align="center" prop="updateByName" />
        <el-table-column label="备注" align="left" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding" fixed="right" width="220">
          <template #default="scope">
            <el-tooltip content="修改" placement="top" v-if="scope.row.packingType == 0 && (scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5)">
              <el-button v-hasPermi="['wms:packing:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            </el-tooltip>
            <el-tooltip content="扫码修改" placement="top" v-if="scope.row.packingType == 1 && (scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5)">
              <el-button v-hasPermi="['wms:packing:edit']" link type="primary" icon="Edit" @click="handleScanUpdate(scope.row)">扫码修改</el-button>
            </el-tooltip>
            <el-tooltip content="送仓" placement="top" v-if="scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5">
              <el-button v-hasPermi="['wms:packing:edit']" link type="success" icon="ShoppingCart" @click="handlePendingInbound(scope.row)">送仓</el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top" v-if="scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5">
              <el-button v-hasPermi="['wms:packing:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改打包记录对话框 -->
    <PackingDialog ref="packingRef" @packingCallBack="packingCallBack" />

    <!-- 添加或修改扫码标签方式打包记录对话框 -->
    <PackingScanDialog ref="packingScanRef" @packingCallBack="packingCallBack" />

    <!-- 送仓对话框 -->
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
import { listPackingAndDetail, delPacking, inBoundPending } from '@/api/wms/packing';
import { PackingVO, PackingQuery, PackingForm } from '@/api/wms/packing/types';
import PackingDialog from '@/views/wms/packing/components/packingDialog.vue';
import PackingScanDialog from '@/views/wms/packing/components/packingScanDialog.vue';
import { ref } from 'vue';
import { WarehouseLocationVO } from '@/api/wms/warehouseLocation/types';
import { listWarehouseLocation } from '@/api/wms/warehouseLocation';
import useDialog from '@/hooks/useDialog';
const packingRef = ref<InstanceType<typeof PackingDialog>>();
const packingScanRef = ref<InstanceType<typeof PackingScanDialog>>();

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

const allCount = ref(0);
const waitInStoreCount = ref(0);
const pendingInboundCount = ref(0);
const warehouseRejectCount = ref(0);
const warehouseFailedCount = ref(0);

const buttonLoading = ref(false);
const queryFormRef = ref<ElFormInstance>();
const packingFormRef = ref<ElFormInstance>();
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];
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
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询打包记录列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.status = null;
  if (tabActiveName.value == 'all') {
    queryParams.value.status = null;
  } else if (tabActiveName.value == 'waitInStore') {
    queryParams.value.status = 1;
  } else if (tabActiveName.value == 'pendingInbound') {
    queryParams.value.status = 2;
  } else if (tabActiveName.value == 'warehouseReject') {
    queryParams.value.status = 4;
  } else if (tabActiveName.value == 'warehouseFailed') {
    queryParams.value.status = 5;
  }
  const res = await listPackingAndDetail(queryParams.value);
  packingList.value = res.rows;
  total.value = res.total;
  if (tabActiveName.value == 'all') {
    allCount.value = res.total;
  } else if (tabActiveName.value == 'waitInStore') {
    waitInStoreCount.value = res.total;
  } else if (tabActiveName.value == 'pendingInbound') {
    pendingInboundCount.value = res.total;
  } else if (tabActiveName.value == 'warehouseReject') {
    warehouseRejectCount.value = res.total;
  } else if (tabActiveName.value == 'warehouseFailed') {
    warehouseFailedCount.value = res.total;
  }
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
  packingRef.value.title = '新增打包记录';
  packingRef.value.openDialog();
  packingRef.value?.initPackingDialog(null);
};

/** 扫码新增按钮操作 */
const handleScanAdd = () => {
  reset();
  packingScanRef.value.title = '扫码新增打包记录';
  packingScanRef.value.openDialog();
  packingScanRef.value?.initPackingDialog(null);
};

/** 修改按钮操作 */
const handleUpdate = (row?: PackingVO) => {
  const _id = row?.id || ids.value[0];
  packingRef.value.title = '修改打包记录';
  packingRef.value.openDialog();
  packingRef.value?.initPackingDialog(_id);
};

/** 扫码修改按钮操作 */
const handleScanUpdate = (row?: PackingVO) => {
  const _id = row?.id || ids.value[0];
  packingScanRef.value.title = '扫码修改打包记录';
  packingScanRef.value.openDialog();
  packingScanRef.value?.initPackingDialog(_id);
};

/** 删除按钮操作 */
const handleDelete = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('确认是否删除打包记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
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
const handleMultiPendingInbound = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  visible.value = true;
  await getWarehouseList();
  form.value = row;
};
/** 送仓按钮操作 */
const handlePendingInbound = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  visible.value = true;
  await getWarehouseList();
  form.value = row;
};
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '送仓'
});
const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
/** 查询仓位信息列表 */
const getWarehouseList = async () => {
  const res = await listWarehouseLocation({
    parentId: 0
  });
  warehouseLocationList.value = res.data;
};
const submitInbound = () => {
  packingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await inBoundPending({
          id: form.value.id,
          warehouseCode: form.value.warehouseCode,
          palletCode: form.value.palletCode,
          packingCode: form.value.packingCode
        }).finally(() => (buttonLoading.value = false));
      }
      visible.value = false;
      proxy?.$modal.msgSuccess('送仓成功');
      await getList();
    }
  });
};

const packingCallBack = () => {
  getList();
};

onMounted(() => {
  getList();
});
</script>
