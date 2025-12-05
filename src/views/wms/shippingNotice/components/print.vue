<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="客户代码" prop="customerCode">
              <el-input v-model="queryParams.customerCode" placeholder="请输入客户代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户名称" prop="customerName">
              <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户单号" prop="customerNo">
              <el-input v-model="queryParams.customerNo" placeholder="请输入客户订单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发货日期" prop="deliveryTime">
              <el-date-picker v-model="queryParams.deliveryTime" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择发货日期" :shortcuts="shortcuts" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="旧料号" prop="oldItem">
              <el-input v-model="queryParams.oldItem" placeholder="请输入旧料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入物料描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="statusList" style="width: 308px">
              <el-select v-model="queryParams.statusList" placeholder="请选择状态" clearable multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="5">
                <el-option v-for="dict in wms_shipping_notice_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
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
          <el-dropdown trigger="hover">
            <el-button type="primary">
              字段筛选<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="dropdown-menu">
                <el-row :gutter="20" type="flex" class="row-flex">
                  <el-col :span="12">
                    <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">全选</el-checkbox>
                  </el-col>
                  <el-checkbox-group v-model="checkedColumns" @change="handleCheckedColumnChange">
                    <el-col v-for="item in tableColumnList" :key="item.value" :span="12" :offset="2">
                      <el-checkbox :key="item.value" :label="item.label" :value="item" :disabled="item.disabled">
                        {{ item.label }}
                      </el-checkbox>
                    </el-col>
                  </el-checkbox-group>
                </el-row>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingNotice:print']" color="#626aef" plain icon="Printer" @click="handlePrint"> 打印</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <!-- 显示表格 -->
      <el-table
        v-show="2 > 1"
        ref="multipleTableRef"
        :key="tableKey"
        v-loading="loading"
        row-key="id"
        :data="shippingNoticeList"
        border
        fit
        highlight-current-row
        style="width: 100%"
        :header-cell-style="{ textAlign: 'center' }"
        :cell-style="{ textAlign: 'center' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"  />
        <el-table-column :label="(queryParams.deliveryTime ? parseTime(queryParams.deliveryTime, '{y}-{m}-{d}') : '') + ' 出货单'">
          <el-table-column label="状态" align="center" prop="status">
            <template #default="scope">
              <dict-tag :options="wms_shipping_notice_status" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column v-for="item in checkedColumns || defaultTableColumnList" :key="item.value" :label="item.label" :prop="item.value">
            <template #default="scope">
              <QRCode v-if="item.value == 'qrCode'" v-bind="scope.row.qrCode"></QRCode>
              <span v-else-if="item.value == 'deliveryTime'">{{ parseTime(scope.row.deliveryTime, '{y}-{m}-{d}') }}</span>
              <span v-else-if="item.value == 'qty'">{{ scope.row.qtyRemark ? scope.row.qty + '-' + scope.row.qtyRemark : scope.row.qty }}</span>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>
      <!-- 打印表格 -->
      <div style="display: none">
        <div id="printContent">
          <table cellspacing="0" cellpadding="0" border="1" style="height: auto; width: 100%">
            <caption style="margin-bottom: 10px; font-size: 22px; font-weight: bold">
              {{
                (queryParams.deliveryTime ? parseTime(queryParams.deliveryTime, '{y}-{m}-{d}') : '') + ' 出货单'
              }}
            </caption>
            <thead>
              <tr>
                <th v-for="item in checkedColumns" :key="item.value">{{ item.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in checkedShippingNoticeList.length > 0 ? checkedShippingNoticeList : shippingNoticeList" :key="index">
                <td v-if="item.rowspan" :rowspan="item.rowspan" :class="[item.status == 3 ? 'del-status' : '', 'normal-status']">{{ item.customerCode }}</td>
                <td v-if="item.rowspan" :rowspan="item.rowspan" :class="[item.status == 3 ? 'del-status' : '', 'normal-status']">{{ item.customerName }}</td>
                <td v-if="item.rowspan" :rowspan="item.rowspan">
                  <QRCode v-bind="item.qrCode" style="width: 100px"></QRCode>
                </td>
                <td v-for="itemColumn in checkedColumns.filter((item) => !item.disabled)" :key="itemColumn.value" :class="[item.status == 3 ? 'del-status' : '', 'normal-status', itemColumn.value === 'item' ||  itemColumn.value === 'oldItem'? 'item-width' : '']" >
                  <template v-if="itemColumn.value === 'qty'">
                    {{ item.qtyRemark ? item.qty + '-' + item.qtyRemark : item.qty }}
                  </template>
                  <template v-else-if="itemColumn.value === 'remark' || itemColumn.value === 'itemDesc' || itemColumn.value === 'customerName'">
                    <div>{{ item[itemColumn.value] }}</div>
                  </template>
                  <template v-else>
                    {{ item[itemColumn.value] }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup name="ShippingNotice" lang="ts">
import { reactive, ref } from 'vue';
import { listShippingNotice, updateBatchShippingNotice } from '@/api/wms/shippingNotice';
import { ShippingNoticeForm, ShippingNoticeQuery, ShippingNoticeVO } from '@/api/wms/shippingNotice/types';
import QRCode from './QRCode.vue';
import { parseTime } from '@/utils/ruoyi';
import printJS from 'print-js';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_shipping_notice_status } = toRefs<any>(proxy?.useDict('wms_shipping_notice_status'));

const shippingNoticeList = ref<ShippingNoticeVO[]>([]);
const checkedShippingNoticeList = ref<ShippingNoticeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const multipleTableRef = ref(null);
const total = ref(0);
const tableKey = ref(1);
const checkAll = ref(true);
const isIndeterminate = ref(true);
const checkedColumns = ref([]);
const defaultTableColumnList = [
  {
    value: 'customerCode',
    label: '客户代码',
    disabled: true
  },
  {
    value: 'customerName',
    label: '客户名称',
    disabled: true
  },
  {
    value: 'qrCode',
    label: '二维码',
    disabled: true
  }
];
const tableColumnList = [
  {
    value: 'customerCode',
    label: '客户代码',
    disabled: true
  },
  {
    value: 'customerName',
    label: '客户名称',
    disabled: true
  },
  {
    value: 'qrCode',
    label: '二维码',
    disabled: true
  },
  {
    value: 'customerNo',
    label: '客户订单号',
    disabled: false
  },
  {
    value: 'deliveryDestination',
    label: '目的地',
    disabled: false
  },
  {
    value: 'item',
    label: '物料',
    disabled: false
  },
  {
    value: 'oldItem',
    label: '旧料号',
    disabled: false
  },
  {
    value: 'itemDesc',
    label: '物料描述',
    disabled: false
  },
  {
    value: 'qty',
    label: '出货数量',
    disabled: false
  },
  // {
  //   value: 'status',
  //   label: '状态'
  // },
  {
    value: 'remark',
    label: '备注',
    disabled: false
  }
];
const handleCheckAllChange = (checkAllFlag: boolean) => {
  checkedColumns.value = checkAllFlag ? tableColumnList : defaultTableColumnList;
  isIndeterminate.value = false;
};
const handleCheckedColumnChange = (value: string[]) => {
  const checkedCount = checkedColumns.value.length;
  checkAll.value = checkedCount === tableColumnList.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < tableColumnList.length;
};
watch(
  checkedColumns,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);
const shortcuts = [
  {
    text: '前天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 48);
      return date;
    }
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 24);
      return date;
    }
  },
  {
    text: '今天',
    value: new Date()
  },
  {
    text: '明天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24);
      return date;
    }
  },
  {
    text: '后天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 48);
      return date;
    }
  }
];
const queryFormRef = ref<ElFormInstance>();
const shippingNoticeFormRef = ref<ElFormInstance>();

const initFormData: ShippingNoticeForm = {
  id: undefined,
  customerCode: undefined,
  customerName: undefined,
  customerNo: undefined,
  shipmentNo: undefined,
  deliveryDestination: undefined,
  deliveryTime: undefined,
  item: undefined,
  oldItem: undefined,
  itemDesc: undefined,
  qty: undefined,
  qtyRemark: undefined,
  remark: undefined
};
const data = reactive<PageData<ShippingNoticeForm, ShippingNoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 1000,
    customerCode: undefined,
    customerName: undefined,
    customerNo: undefined,
    shipmentNo: undefined,
    deliveryDestination: undefined,
    deliveryTime: undefined,
    item: undefined,
    oldItem: undefined,
    itemDesc: undefined,
    qty: undefined,
    qtyRemark: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);
/**
 *
 * @param dataList 要处理的list
 * @returns 返回处理好的list
 */
const handleSpanList = (dataList) => {
  for (let i = 0; i < dataList.length; i++) {
    // 定义循环开始行
    let startRow;
    // 定义需合并的行数
    let rowspan = 1;
    // 循环到最后一行时
    if (i === dataList.length - 1) {
      // 如果最后一行和倒数第二行属性不同，则rowspan=1；否则直接结束循环
      if (dataList[i]?.customerCode !== dataList[i - 1]?.customerCode) {
        dataList[i].rowspan = rowspan;
      }
      break;
    }
    // 内层循环记录rowspan的数量
    for (let j = i; j < dataList.length - 1; j++) {
      // 记录循环结束的行数
      startRow = j;
      // 属性相同则rowspan+1；否则直接结束内循环
      if (dataList[j].customerCode && dataList[j].customerCode === dataList[j + 1].customerCode) {
        rowspan++;
      } else {
        break;
      }
    }
    // 为数组添加rowspan属性
    dataList[i].rowspan = rowspan;
    // 控制外循环从内循环结束的行数开始
    i = startRow;
  }
  return dataList;
};

/** 查询出货通知列表 */
const getList = async () => {
  loading.value = true;
  multipleTableRef.value.clearSelection();
  const res = await listShippingNotice(queryParams.value);
  addQrCode(res.rows);
  shippingNoticeList.value = res.rows;
  checkedShippingNoticeList.value = handleSpanList(shippingNoticeList.value);
  multipleTableRef.value.toggleAllSelection();
  total.value = res.total;
  loading.value = false;
};

/** 增加Q二维码 */
const addQrCode = (shippingNoticeVoList: ShippingNoticeVO[]) => {
  for (let shippingNotice of shippingNoticeVoList) {
    // 二维码样式
    shippingNotice.qrCode = {
      value: shippingNotice.customerName, // 生成二维码的字符串
      width: 30,
      height: 30,
      size: 100,
      margin: 0,
      dark: '#335eea',
      light: '#00000000',
      type: 'DataURL'
    };
  }
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  shippingNoticeFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShippingNoticeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
  let arr = selection;
  arr.sort((a, b) => {
    return a.id - b.id;
  });
  addQrCode(selection);
  checkedShippingNoticeList.value = handleSpanList(arr);
};

/** 打印按钮操作 */
const handlePrint = () => {
  if (checkedShippingNoticeList.value.length > 0) {
    printJS({
      printable: 'printContent',
      type: 'html',
      targetStyles: ['*'],
      scanStyles: false,
      style: getPrintStyle()
    });
    // 更新状态为已打印
    checkedShippingNoticeList.value.map((item) => {
      item.status = 4;
    });
    updateBatchShippingNotice({ shippingNoticeBoList: checkedShippingNoticeList.value });
    handleQuery();
  } else {
    proxy?.$modal.msgWarning('请选择需要打印的数据');
  }
};

const getPrintStyle = () => {
  return `
    table {
      width:100%!important;
    }
    .del-status {
      background: #aca5a5;
      color: #ee1414;
      -webkit-print-color-adjust: exact;
    }
    .normal-status {
      -webkit-print-color-adjust: exact;
    }
    .item-width {
      min-width: 130px;
    }
    td {
      vertical-align: middle;
      text-align: center;
      overflow: hidden;
      border-bottom: 1px solid #dfe6ec;
      border-left: 1px solid #dfe6ec;
      padding: 5px 5px;
      text-overflow: ellipsis;
      white-space: normal;
      word-break: break-all;
      color: #606266;
      min-width: 80px;
    }
     td div {
       text-overflow: -o-ellipsis-lastline;
       overflow: hidden;
       text-overflow: ellipsis;
       display: -webkit-box;
       -webkit-line-clamp: 4;
       line-clamp: 4;
       -webkit-box-orient: vertical;
    }
    td:last-child, th:last-child {
      border-right: 1px solid #dfe6ec;
    }
    th {
      vertical-align: middle;
      overflow: hidden;
      word-break: break-word;
      color: #515a6e;
      height: 20px;
      font-size: 14px;
      border-bottom: 1px solid #dfe6ec;
      border-left: 1px solid #dfe6ec;
      border-top: 1px solid #dfe6ec;
    }
  `;
};

onMounted(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  queryParams.value.deliveryTime = parseTime(date, '{y}-{m}-{d} {h}:{i}:{s}');
  checkedColumns.value = tableColumnList;
  getList();
});
</script>
<style scoped lang="scss">
.dropdown-menu {
  padding: 10px 10px 10px 10px;
  box-sizing: border-box;
  position: relative;
}
.del-status {
  background: #aca5a5;
  color: #ee1414;
}
.normal-status {
}
</style>
