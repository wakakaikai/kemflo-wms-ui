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
            <el-form-item label="归属部门" prop="createDept">
              <el-tree-select
                v-model="queryParams.createDept"
                :data="enabledDeptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' } as any"
                value-key="id"
                placeholder="请选择归属部门"
                check-strictly
                @change="handleDeptChange"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button type="warning" icon="Search" @click="handleAllTabQuery">查询所有状态</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

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

      <el-tab-pane name="warehouseReject">
        <template #label>
          <el-badge :value="warehouseRejectCount" class="item" color="#f56c6c" :offset="[10, 0]" :max="9999999999">
            <span>已退回</span>
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
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="Packing" lang="ts">
import { listScadaPackingAndDetail } from '@/api/wms/packing';
import { PackingForm, PackingQuery, PackingVO } from '@/api/wms/packing/types';
import api from '@/api/system/user';
import { ref } from 'vue';
import { DeptTreeVO } from '@/api/system/dept/types';
import { optionselect } from '@/api/system/post';
import { PostVO } from '@/api/system/post/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_packing_status, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_packing_status', 'wms_work_order_check_enable'));

const tabActiveName = ref('pendingInbound');
const packingList = ref<PackingVO[]>([]);
const checkedPackingList = ref<PackingVO[]>([]);
const loading = ref(true);
const deptOptions = ref<DeptTreeVO[]>([]);
const enabledDeptOptions = ref<DeptTreeVO[]>([]);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const palletCodeList = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const allCount = ref(0);
const waitInStoreCount = ref(0);
const pendingInboundCount = ref(0);
const warehouseRejectCount = ref(0);
const pendingCount = ref(0); // 待接收数量
const receivedCount = ref(0); // 已接收数量
const warehouseFailedCount = ref(0); // 接收失败
const postOptions = ref<PostVO[]>([]);
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
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

async function handleDeptChange(value: number | string) {
  const response = await optionselect(value);
  postOptions.value = response.data;
  form.value.postIds = [];
}

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
  } else if (tabActiveName.value == 'warehouseReceive') {
    queryParams.value.status = 3;
  } else if (tabActiveName.value == 'warehouseReject') {
    queryParams.value.status = 4;
  } else if (tabActiveName.value == 'warehouseFailed') {
    queryParams.value.status = 5;
  }

  const res = await listScadaPackingAndDetail(queryParams.value);
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
/** 搜索按钮操作 */
const handleAllTabQuery = async () => {
  queryParams.value.pageNum = 1;
  loading.value = true;

  // 保存当前tab
  const currentTab = tabActiveName.value;

  try {
    // 遍历所有tab并获取数据
    const tabs = ['all', 'waitInStore', 'pendingInbound', 'warehouseReceive', 'warehouseReject', 'warehouseFailed'];

    for (const tab of tabs) {
      tabActiveName.value = tab;
      await getList();
    }
  } finally {
    // 恢复原来的tab和关闭加载状态
    tabActiveName.value = currentTab;
    loading.value = false;
    // 重新加载当前tab数据以确保显示正确
    await getList();
  }
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
/** 查询部门下拉树结构 */
const getDeptTree = async () => {
  const res = await api.deptTreeSelect();
  deptOptions.value = res.data;
  enabledDeptOptions.value = filterDisabledDept(res.data);
};
/** 过滤禁用的部门 */
const filterDisabledDept = (deptList: DeptTreeVO[]) => {
  return deptList.filter((dept) => {
    if (dept.disabled) {
      return false;
    }
    if (dept.children && dept.children.length) {
      dept.children = filterDisabledDept(dept.children);
    }
    return true;
  });
};
onMounted(() => {
  getDeptTree(); // 初始化部门数据
  getList();
});
</script>
<style lang="scss" scoped>
:deep(.el-tabs__nav-wrap) {
  .el-tabs__item {
    margin: 0 10px !important;
  }
}
</style>
