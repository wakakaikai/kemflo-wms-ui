<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mt-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="打包编号" prop="packingCode">
              <el-input v-model="queryParams.packingCode" placeholder="请输入打包编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="目的仓库" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入目的仓库" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="标签码" prop="sn">
              <el-input v-model="queryParams.sn" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
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

    <!-- 打包列表Tab标签页 -->
    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane name="pendingInbound">
        <template #label>
          <el-badge :value="pendingCount" class="item" color="#e6a23c" :offset="[10, 0]" :max="9999999999">
            <span>待接收</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="warehouseFailed">
        <template #label>
          <el-badge :value="warehouseFailedCount" class="item" color="#f56c6c" :offset="[10, 0]" :max="9999999999">
            <span>接收失败</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="warehouseReceive">
        <template #label>
          <el-badge :value="receivedCount" class="item" color="#32CD32" :offset="[10, 0]" :max="9999999999">
            <span>已接收</span>
          </el-badge>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="24" class="mb8">
          <!--          <el-col v-if="tabActiveName == 'pendingInbound'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="danger" plain icon="RefreshLeft" :disabled="multiple" @click="handleRejectPacking()">信息不一致-退回 </el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'pendingInbound'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="CircleCheck" :disabled="multiple" @click="handleBatchReceivePacking()">信息一致-接收 </el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:packing:export']" type="warning" plain icon="Download" @click="handleExport"> 导出 </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="packingList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.packingDetailVoList" style="width: calc(100% - 110px); float: right; margin: 10px 0" empty-text="暂无数据">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="序号" align="center" width="60">
                <template #default="{ $index }">
                  {{ $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="工单号" align="center" width="130" prop="workOrderNo">
                <template #default="scope">
                  <router-link :to="{ path: '/receiptOrder/packingDetailSn', query: { packingDetailId: scope.row.id } }" class="link-type">
                    <span>{{ scope.row.workOrderNo }}</span>
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column label="标签码" align="center" width="130" prop="sn" />
              <el-table-column label="产品料号" align="center" prop="item" />
              <el-table-column label="产品描述" align="left" prop="itemDesc" />
              <el-table-column label="计划数量" align="center" prop="plannedQty" />
              <el-table-column label="打包数量" align="center" prop="packingQty" />
              <el-table-column label="入库检" prop="checkEnable" align="center">
                <template #default="scope">
                  <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
                </template>
              </el-table-column>
              <el-table-column label="物料凭证号" prop="materialOrderNo" align="center" />
              <el-table-column label="物料文件项次" prop="materialItem" align="center" />
              <el-table-column label="备注" prop="remark" align="center" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="栈板编号" align="left" prop="palletCode" />
        <el-table-column label="打包编号" align="center" prop="packingCode" />
        <el-table-column label="目的仓库" align="left" prop="warehouseCode">
          <template #default="scope">
            <span v-if="scope.row.warehouseCode">{{ `${scope.row.warehouseCode} - ${scope.row.warehouseDesc}` }}</span>
            <span v-else></span>
          </template>
        </el-table-column>
        <el-table-column label="库区" align="left" prop="areaCode" />
        <el-table-column label="库位" align="left" prop="locationCode" />
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
        <el-table-column label="操作" align="center" class-name="small-padding " fixed="right" width="160">
          <template #default="scope">
            <el-tooltip v-if="tabActiveName == 'pendingInbound' || tabActiveName == 'warehouseFailed'" content="退回" placement="top">
              <el-button v-hasPermi="['wms:packing:edit']" link type="danger" icon="RefreshLeft" @click="handleRejectPacking(scope.row)">退回</el-button>
            </el-tooltip>
            <el-tooltip content="入库" placement="top" v-if="tabActiveName == 'pendingInbound' || tabActiveName == 'warehouseFailed'">
              <el-button v-hasPermi="['wms:packing:edit']" link type="success" icon="CircleCheck" @click="handleReceivePacking(scope.row)">接收</el-button>
            </el-tooltip>
            <el-tooltip content="出库" placement="top" v-if="tabActiveName == 'warehouseReceive'">
              <el-button v-hasPermi="['wms:packing:edit']" link type="danger" icon="CircleCheck" @click="handleReturnPacking(scope.row)">退料</el-button>
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
              <el-text> {{ form.warehouseCode }}</el-text>
            </el-form-item>
          </el-col>
          <!--          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="目的库区" prop="areaCode">
              <el-input v-model="form.areaCode" clearable placeholder="请输入目的库位或点击选择" @keydown.tab.prevent="areaCodeKeyDownTab" @keydown.enter.prevent="areaCodeKeyDownTab">
                <template #append>
                  <el-button icon="Search" type="primary" @click="showStorageAreaDialog" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>-->
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="目的库位" prop="locationCode">
              <el-input v-model="form.locationCode" clearable placeholder="请输入目的库位或点击选择" @keydown.tab.prevent="locationCodeKeyDownTab" @keydown.enter.prevent="locationCodeKeyDownTab">
                <template #append>
                  <el-button icon="Search" type="primary" @click="showStorageLocationDialog" />
                </template>
              </el-input>
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

    <!-- 退料确认对话框 -->
    <el-dialog v-model="returnVisible" :title="returnTitle" width="60%" append-to-body>
      <el-form ref="returnFormRef" :model="returnForm" label-width="120px">
        <el-row>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="打包编号">
              <el-text>{{ returnForm.packingCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="栈板编号">
              <el-text>{{ returnForm.palletCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="目的仓库">
              <el-text>{{ returnForm.warehouseCode }} - {{ returnForm.warehouseDesc }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="库区">
              <el-text>{{ returnForm.areaCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="库位">
              <el-text>{{ returnForm.locationCode }}</el-text>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 明细列表 -->
        <el-table :data="returnForm.packingDetailVoList" style="width: 100%; margin-top: 20px">
          <el-table-column label="工单号" align="center" prop="workOrderNo" />
          <el-table-column label="标签码" align="center" prop="sn" />
          <el-table-column label="产品料号" align="center" prop="item" />
          <el-table-column label="产品描述" align="left" prop="itemDesc" />
          <el-table-column label="计划数量" align="center" prop="plannedQty" />
          <el-table-column label="打包数量" align="center" prop="packingQty" />
          <el-table-column label="物料凭证号" prop="materialOrderNo" align="center" />
        </el-table>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="returnVisible = false">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitReturn">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  </div>
</template>

<script setup name="Inbound" lang="ts">
import { listPackingAndDetail, receivePacking, rejectPacking,returnPacking } from '@/api/wms/packing';
import { PackingForm, PackingQuery, PackingVO } from '@/api/wms/packing/types';
import PackingDialog from '@/views/wms/packing/components/packingDialog.vue';
import useDialog from '@/hooks/useDialog';
import { WarehouseVO } from '@/api/wms/warehouse/types';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { getWarehouseByLocationCode } from '@/api/wms/storageLocation';
import { listWarehouse } from '@/api/wms/warehouse';

const packingRef = ref<InstanceType<typeof PackingDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_packing_status, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_packing_status', 'wms_work_order_check_enable'));
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();

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
const pendingCount = ref(0); // 待接收数量
const receivedCount = ref(0); // 已接收数量
const warehouseFailedCount = ref(0); // 接收失败

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
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const returnVisible = ref(false);
const returnTitle = ref('退料确认');
const returnFormRef = ref<ElFormInstance>();
const returnForm = ref<PackingForm>({ ...initFormData });

/** 查询打包记录列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.status = null;
  if (tabActiveName.value == 'pendingInbound') {
    queryParams.value.status = 2;
  } else if (tabActiveName.value == 'warehouseReceive') {
    queryParams.value.status = 3;
  } else if (tabActiveName.value == 'warehouseFailed') {
    queryParams.value.status = 5;
  }
  const res = await listPackingAndDetail(queryParams.value);
  packingList.value = res.rows;
  total.value = res.total;
  if (tabActiveName.value == 'pendingInbound') {
    pendingCount.value = res.total;
  } else if (tabActiveName.value == 'warehouseReceive') {
    receivedCount.value = res.total;
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

// 显示库位选择对话框
const showStorageLocationDialog = () => {
  storageLocationDialogRef.value.openDialog();
  storageLocationDialogRef.value.handleQuery();
};
const storageLocationSelectCallBack = (record: any) => {
  form.value.warehouseCode = record.warehouseCode;
  form.value.areaCode = record.areaCode;
  form.value.locationCode = record.locationCode;
};
const locationCodeKeyDownTab = async () => {
  if (form.value.locationCode) {
    form.value.locationCode = form.value.locationCode.trim();
    const res = await getWarehouseByLocationCode({ locationCode: form.value.locationCode });
    if (res.data) {
      form.value.warehouseCode = res.data.warehouseCode;
      form.value.areaCode = res.data.areaCode;
      form.value.locationCode = res.data.locationCode;
    } else {
      ElMessage.error('未找到库位及仓库信息');
      return;
    }
  }
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
const warehouseLocationList = ref<WarehouseVO[]>([]);
const getWarehouseList = async () => {
  const res = await listWarehouse({});
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
              warehouseCode: form.value.warehouseCode,
              areaCode: form.value.areaCode,
              locationCode: form.value.locationCode,
              palletCode: form.value.palletCode,
              packingCode: form.value.packingCode
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

/** 退料按钮操作 */
const handleReturnPacking = (row?: PackingVO) => {
  const currentRow = row || checkedPackingList.value[0]; // 如果没有传入row，则使用选中的第一项
  if (!currentRow) {
    proxy?.$modal.msgWarning('请先选择要退料的数据');
    return;
  }

  // 设置退料表单数据
  returnForm.value = { ...currentRow };
  returnVisible.value = true;
};

/** 提交退料 */
const submitReturn = async () => {
  try {
    buttonLoading.value = true;
    await proxy?.$modal.confirm('确认要退料这些明细吗？');

    // 调用退料API
    const res = await returnPacking({
      packingBoList: [
        {
          id: form.value.id,
          warehouseCode: form.value.warehouseCode,
          areaCode: form.value.areaCode,
          locationCode: form.value.locationCode,
          palletCode: form.value.palletCode,
          packingCode: form.value.packingCode
        }
      ]
    });

    if (res.code === 200) {
      proxy?.$modal.msgSuccess('退料成功');
      returnVisible.value = false;
      await getList(); // 刷新列表
    } else {
      proxy?.$modal.msgError(res.msg || '退料失败');
    }
  } catch (error) {
    console.error('退料失败:', error);
    proxy?.$modal.msgError('退料操作失败');
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>
<style lang="scss" scoped>
:deep(.el-tabs__nav-wrap) {
  .el-tabs__item {
    margin: 0 10px !important;
  }
}

.area-description {
  :deep(.el-tag) {
    font-size: 12px;
    padding: 0 8px;
    border-radius: 10px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
