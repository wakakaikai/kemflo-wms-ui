<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :rules="rules" :inline="true" label-width="auto">
            <el-form-item label="工厂" prop="site">
              <el-select v-model="queryParams.site" value-key="id" placeholder="请选择工厂">
                <el-option v-for="item in siteOption" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品条码" prop="sfcStr">
              <el-input v-model="queryParams.sfcStr" placeholder="请输入产品条码" clearable @keyup.enter="handleQuery">
                <template #append>
                  <el-button icon="Search" @click="getSfcList" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="扫码时间" prop="dateTimeRange">
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

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['report:mesProductData:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <el-empty v-if="mesProductDataList.length == 0" v-loading="loading" description="暂无数据" />
      <el-tabs v-else v-model="activeName" :tab-position="'top'" @tab-click="handleTabClick">
        <el-tab-pane v-for="(tableItem, tableIndex) in mesProductDataList" :key="tableIndex" :label="tableItem.tabName" :name="tableItem.tabName">
          <template #label>
            <el-badge :value="tableItem.dataList.length || 0" :max="9999" :offset="[10, 0]">{{ tableItem.tabName }}</el-badge>
          </template>
          <el-table v-if="activeName == tableItem.tabName" :key="tableKey" v-loading="loading" :data="getCurrentPageData(tableItem.dataList)" row-key="sfc">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column
              v-for="(item, index) in tableItem.colsList"
              :key="index"
              :label="item.label"
              :prop="item.prop"
              :min-width="flexColumnWidth(item.label, item.prop, currentPageTable)"
            >
              <template #default="scope">
                <span>{{ scope.row[item.prop] }}</span>
              </template>
            </el-table-column>
            <!--            -->
            <!--            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
              <template #default="scope">
                <el-tooltip content="详情" placement="top">
                  <el-button v-hasPermi="['report:mesProductData:query']" link type="primary" icon="View" @click="handleView(scope.row)"> </el-button>
                </el-tooltip>
              </template>
            </el-table-column>-->
          </el-table>
          <pagination
            v-if="tableItem.dataList.length > 0 && activeName == tableItem.tabName"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            :total="tableItem.dataList.length"
            @pagination="getCurrentPageData(tableItem.dataList)"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <!-- 添加产品条码搜索对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="35%" append-to-body>
      <el-form ref="sfcFormRef" :model="form" :inline="true" label-width="auto">
        <el-form-item label="条码输入框" prop="sfcStr" @paste.native.prevent="pasteContent" @keyup.enter.prevent="handleAddSfc">
          <el-input v-model="form.sfcStr" type="text" placeholder="支持Excel批量粘贴" clearable />
        </el-form-item>
        <el-form-item>
          <el-button icon="Plus" plain type="primary" @click="addSfc">新增</el-button>
          <el-button icon="Refresh" @click="resetSfc">重置</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm()">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
      <el-table :data="sfcTableData">
        <el-table-column label="条码" width="260" align="left" prop="sfc" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="删除" placement="top">
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row, scope.$index)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="mesProductData" lang="ts">
import type { TabsPaneContext } from 'element-plus';
import { listMesProductData } from '@/api/report/mesProductData';
import { MesProductDataQuery, MesProductDataForm } from '@/api/report/mesProductData/types';
import { ref } from 'vue';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const mesProductDataList = ref([]);
const buttonLoading = ref(false);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const total = ref(0);
const tableKey = ref(1);
const currentPageTable = ref([]);
const queryFormRef = ref<ElFormInstance>();
const sfcFormRef = ref<ElFormInstance>();
const sfcTableData = ref([]);

watch(
  mesProductDataList,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const siteOption = [
  {
    value: 'CN00',
    label: '环保'
  },
  {
    value: 'CN10',
    label: '精密'
  }
];
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
const initFormData: MesProductDataForm = {
  item: undefined,
  sfcStr: undefined,
  sfcList: undefined
};
const data = reactive<PageData<MesProductDataForm, MesProductDataQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    shippingCustomerNoticeId: undefined,
    customerCode: undefined,
    sfcStr: undefined,
    sfcList: undefined,
    params: {}
  },
  rules: {
    site: [{ required: true, message: '工厂不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const activeName = ref('');
const handleTabClick = (tab: TabsPaneContext, event: Event) => {
  queryParams.value.pageNum = 1;
};

/** 查询MES生产数据列表 */
const getList = async () => {
  mesProductDataList.value = [];
  if (route.query && (route.query.shippingCustomerNoticeId as string)) {
    queryParams.value.shippingCustomerNoticeId = route.query.shippingCustomerNoticeId;
  }
  if (!queryParams.value.sfcList && queryParams.value.sfcStr) {
    queryParams.value.sfcList = [queryParams.value.sfcStr];
  }
  loading.value = true;
  const res = await listMesProductData(queryParams.value);
  mesProductDataList.value = res.data;
  activeName.value = ((res.data || [])[0] || {}).tabName || '';
  total.value = res.total;
  loading.value = false;
};

const getCurrentPageData = (tableData) => {
  loading.value = true;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  const end = start + queryParams.value.pageSize;
  loading.value = false;
  currentPageTable.value = tableData.slice(start, end);
  return currentPageTable.value;
};

const handleAddSfc = () => {
  sfcTableData.value.push({ 'sfc': form.value.sfcStr });
};

/** 打开弹框 */
const getSfcList = () => {
  dialog.visible = true;
  dialog.title = 'Excel批量粘贴条码';
};
/** 提交按钮 */
const submitForm = (ignoreError: number) => {
  buttonLoading.value = false;
  form.value.sfcStr = '';
  if (sfcTableData.value.length > 0) {
    queryParams.value.sfcList = sfcTableData.value.map((s) => s.sfc);
    queryParams.value.sfcStr = queryParams.value.sfcList.join(',');
  } else {
    form.value.sfcStr = '';
    sfcTableData.value = [];
    queryParams.value.sfcStr = '';
    queryParams.value.sfcList = [];
  }
  dialog.visible = false;
};

/** 处理粘贴内容 */
const pasteContent = (e) => {
  // 复制过来的内容
  let source = e.clipboardData.getData('Text');
  // 首先对源头进行解析
  let rows = source.split('\n'); // 拆成很多行
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] != '') {
      // 如果某一行不是空，再按列拆分
      let columns = rows[i].split('\r'); // 已经按列划分
      sfcTableData.value.push({ 'sfc': columns[0] });
    }
  }
};

/** 重置按钮 */
const resetSfc = () => {
  form.value.sfcStr = '';
  sfcTableData.value = [];
  queryParams.value.sfcList = [];
};
/** 删除按钮操作 */
const handleDelete = (row, index) => {
  sfcTableData.value.splice(index, 1);
};
/** 新增按钮操作 */
const addSfc = () => {
  sfcTableData.value.push({ 'sfc': form.value.sfcStr });
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  sfcFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      queryParams.value.pageNum = 1;
      if (queryParams.value.sfcStr) {
        if (sfcTableData.value.length > 0) {
          queryParams.value.sfcList = sfcTableData.value.map((s) => s.sfc);
        } else {
          queryParams.value.sfcList = [queryParams.value.sfcStr];
        }
      } else {
        queryParams.value.sfcList = [];
      }
      getList();
    }
  });
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 详细按钮操作 */
const handleView = (row: OperLogVO) => {
  dialog.visible = true;
  form.value = row;
};
/** 导出按钮操作 */
const handleExport = () => {
  if (route.query && (route.query.shippingCustomerNoticeId as string)) {
    queryParams.value.shippingCustomerNoticeId = route.query.shippingCustomerNoticeId;
  }
  if (!queryParams.value.sfcList && queryParams.value.sfcStr) {
    queryParams.value.sfcList = [queryParams.value.sfcStr];
  }
  proxy?.download(
    '/mes/scada/productData/export',
    {
      ...queryParams.value
    },
    `MES关键件及检测数据_${new Date().getTime()}.xlsx`
  );
};

// 计算文本宽度
const getTextWidth = (str) => {
  let width = 0;
  const html = document.createElement('span');
  html.innerText = str;
  html.className = 'getTextWidth';
  document.querySelector('body').appendChild(html);
  width = document.querySelector('.getTextWidth').offsetWidth * 0.9;
  document.querySelector('.getTextWidth').remove();
  return width;
};

// 动态计算列宽
const flexColumnWidth = (label, prop, data) => {
  // 将表头加入数组
  const arr = [label];
  data.map((x) => arr.push(x[prop]));
  // 计算每列内容最大的宽度
  const maxWidth = arr.slice(0, 3).reduce((acc, item) => {
    if (item) {
      const width = getTextWidth(item);
      acc = Math.max(acc, width);
    }
    return acc;
  }, 0);
  // 返回最大宽度加上额外的内间距
  return maxWidth + 25 + 'px';
};

onMounted(() => {});
</script>
<style scoped lang="scss">
.badge-content {
  margin-left: 25px;
}
</style>
