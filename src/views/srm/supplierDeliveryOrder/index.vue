<template>
  <div class="p-2">
    <el-card shadow="hover" class="mb-2">
      <el-form :model="query" inline label-width="auto">
        <el-form-item label="送货单号"><el-input v-model="query.deliveryOrderNo" clearable @keyup.enter="loadList" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="query.supplierCode" clearable @keyup.enter="loadList" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable style="width: 130px"><el-option v-for="item in statuses" :key="item.value" v-bind="item" /></el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="loadList">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never">
      <template #header>
        <el-button v-hasPermi="['srm:supplierDeliveryOrder:add']" type="primary" icon="Plus" @click="openCreate">新建送货单</el-button>
      </template>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="deliveryOrderNo" label="送货单号" min-width="180" />
        <el-table-column prop="supplierCode" label="供应商代码" width="120" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="shippingDate" label="发货日期" width="110" />
        <el-table-column prop="plannedArrivalDate" label="预计到货" width="110" />
        <el-table-column prop="totalPackages" label="包装数" width="85" align="right" />
        <el-table-column prop="totalQuantity" label="送货数量" width="110" align="right" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag></template></el-table-column>
        <el-table-column prop="receiptNo" label="入库单号" min-width="150" />
        <el-table-column label="操作" fixed="right" width="410">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewOrder(row)">详情</el-button>
            <el-button v-if="row.status === 0" v-hasPermi="['srm:supplierDeliveryOrder:edit']" link type="primary" @click="editOrder(row)">编辑</el-button>
            <el-button v-hasPermi="['srm:supplierDeliveryOrder:label:print']" link type="primary" @click="printOrderLabels(row)">标签打印</el-button>
            <el-button v-hasPermi="['srm:supplierDeliveryOrder:deliveryNote:print']" link type="primary" @click="printDeliveryNote(row)">A4送货单</el-button>
            <el-button v-if="row.status === 0" v-hasPermi="['srm:supplierDeliveryOrder:submit']" link type="success" @click="submitOrder(row)">确认发货</el-button>
            <el-button v-if="row.status === 2 || row.status === 3" v-hasPermi="['srm:supplierDeliveryOrder:receipt:print']" link type="primary" @click="printReceipt(row)">A4入库单</el-button>
            <el-button v-if="row.status === 0" v-hasPermi="['srm:supplierDeliveryOrder:remove']" link type="danger" @click="removeOrder(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
    </el-card>

    <el-dialog v-model="editorVisible" :title="readonly ? '送货单详情' : form.id ? '编辑送货单' : '新建送货单'" width="92%" top="3vh" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="95px" :disabled="readonly">
        <el-row :gutter="16">
          <el-col :span="6"><el-form-item label="供应商代码" prop="supplierCode"><el-input v-model="form.supplierCode" readonly placeholder="选择采购订单后自动带出" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="供应商名称"><el-input v-model="form.supplierName" readonly /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="发货日期" prop="shippingDate"><el-date-picker v-model="form.shippingDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="预计到货"><el-date-picker v-model="form.plannedArrivalDate" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="联系电话"><el-input v-model="form.contactPhone" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="承运商"><el-input v-model="form.carrier" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="物流单号"><el-input v-model="form.trackingNo" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="车牌号"><el-input v-model="form.vehicleNo" /></el-form-item></el-col>
          <el-col :span="18"><el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <div class="detail-toolbar">
        <b>包装标签明细（每行对应一张 97×84 标签）</b>
        <el-button v-if="!readonly" type="primary" icon="Plus" @click="purchaseVisible = true">选择采购订单</el-button>
      </div>
      <el-table :data="form.details" border max-height="420">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="poNumber" label="采购订单" min-width="130" />
        <el-table-column prop="itemNumber" label="行" width="65" />
        <el-table-column prop="scheduleNumber" label="计划行" width="75" />
        <el-table-column prop="materialCode" label="物料编码" min-width="120" />
        <el-table-column prop="materialDesc" label="物料描述" min-width="160" show-overflow-tooltip />
        <el-table-column label="本箱数量" width="130"><template #default="{ row }"><el-input-number v-model="row.quantity" :disabled="readonly" :min="0.001" :precision="3" :controls="false" style="width:100%" /></template></el-table-column>
        <el-table-column prop="unit" label="单位" width="65" />
        <el-table-column label="供应商批次" min-width="135"><template #default="{ row }"><el-input v-model="row.batchCode" :disabled="readonly" /></template></el-table-column>
        <el-table-column label="生产日期" width="145"><template #default="{ row }"><el-date-picker v-model="row.productionDate" :disabled="readonly" value-format="YYYY-MM-DD" style="width:125px" /></template></el-table-column>
        <el-table-column label="失效日期" width="145"><template #default="{ row }"><el-date-picker v-model="row.expiryDate" :disabled="readonly" value-format="YYYY-MM-DD" style="width:125px" /></template></el-table-column>
        <el-table-column label="规格" width="125"><template #default="{ row }"><el-input v-model="row.specification" :disabled="readonly" /></template></el-table-column>
        <el-table-column label="包装方式" width="125"><template #default="{ row }"><el-input v-model="row.packageMethod" :disabled="readonly" /></template></el-table-column>
        <el-table-column v-if="!readonly" label="操作" fixed="right" width="150"><template #default="{ row, $index }"><el-button link type="primary" @click="splitLine(row, $index)">按份数拆分</el-button><el-button link type="danger" @click="form.details.splice($index, 1)">删除</el-button></template></el-table-column>
      </el-table>
      <template #footer><el-button @click="editorVisible = false">关闭</el-button><el-button v-if="!readonly" :loading="saving" type="primary" @click="saveOrder">保存草稿</el-button></template>
    </el-dialog>

    <el-dialog v-model="labelVisible" title="标签打印 / 补打印（97×84mm）" width="80%" append-to-body>
      <el-alert title="勾选要打印的包装标签；已打印标签再次打印会计为补打印。标签数据与工单入库标签完全分开。" type="info" :closable="false" class="mb-3" />
      <el-table :data="printTarget?.details || []" border @selection-change="labelSelection = $event">
        <el-table-column type="selection" width="50" /><el-table-column prop="lineNo" label="标签行" width="80" /><el-table-column prop="poNumber" label="采购订单" width="135" />
        <el-table-column prop="itemNumber" label="项次" width="70" /><el-table-column prop="scheduleNumber" label="计划行" width="75" /><el-table-column prop="materialCode" label="物料" width="130" />
        <el-table-column prop="batchCode" label="批次" width="130" /><el-table-column prop="quantity" label="数量" width="90" /><el-table-column label="箱号" width="80"><template #default="{row}">{{ row.packageNo }}/{{ row.packageCount }}</template></el-table-column>
        <el-table-column prop="printCount" label="打印次数" width="90" /><el-table-column prop="lastPrintTime" label="最后打印时间" min-width="165" />
      </el-table>
      <template #footer><el-button @click="labelVisible=false">关闭</el-button><el-button type="primary" :disabled="!labelSelection.length" @click="confirmLabelPrint">打印选中标签</el-button></template>
    </el-dialog>

    <el-dialog v-model="purchaseVisible" title="选择当前账号所属供应商的采购订单" width="85%" append-to-body>
      <el-form :model="purchaseQuery" inline><el-form-item label="采购订单"><el-input v-model="purchaseQuery.poNumber" clearable /></el-form-item><el-form-item label="物料"><el-input v-model="purchaseQuery.materialCode" clearable /></el-form-item><el-button type="primary" @click="loadPurchaseLines">查询</el-button></el-form>
      <el-table ref="purchaseTable" v-loading="purchaseLoading" :data="purchaseRows" row-key="id" @selection-change="purchaseSelection = $event">
        <el-table-column type="selection" width="50" /><el-table-column prop="poNumber" label="采购订单" width="130" /><el-table-column prop="itemNumber" label="行" width="65" />
        <el-table-column prop="materialCode" label="物料" width="130" /><el-table-column prop="materialDesc" label="物料描述" min-width="180" />
        <el-table-column prop="supplierCode" label="供应商" width="110" /><el-table-column prop="deliveryDate" label="交货日期" width="110" />
        <el-table-column prop="openQuantity" label="剩余数量" width="110" align="right" /><el-table-column prop="orderUnit" label="单位" width="70" />
      </el-table>
      <pagination v-show="purchaseTotal > 0" v-model:page="purchaseQuery.pageNum" v-model:limit="purchaseQuery.pageSize" :total="purchaseTotal" @pagination="loadPurchaseLines" />
      <template #footer><el-button @click="purchaseVisible = false">取消</el-button><el-button type="primary" @click="appendPurchaseLines">确定</el-button></template>
    </el-dialog>

    <SupplierLabelPrint ref="labelPrintRef" :order="printTarget" />
    <DeliveryNotePrint ref="deliveryNotePrintRef" />
    <ReceiptPrint ref="receiptPrintRef" />
  </div>
</template>

<script setup name="SupplierDeliveryOrder" lang="ts">
import {
  addSupplierDeliveryOrder, deleteSupplierDeliveryOrder, getSupplierDeliveryOrder, listAuthorizedPurchaseLines,
  listSupplierDeliveryOrder, recordSupplierLabelPrint, submitSupplierDeliveryOrder, updateSupplierDeliveryOrder
} from '@/api/srm/supplierDeliveryOrder';
import type { PurchaseLine, SupplierDeliveryDetail, SupplierDeliveryOrder } from '@/api/srm/supplierDeliveryOrder/types';
import SupplierLabelPrint from './components/SupplierLabelPrint.vue';
import DeliveryNotePrint from './components/DeliveryNotePrint.vue';
import ReceiptPrint from './components/ReceiptPrint.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const statuses = [
  { value: 0, label: '草稿' }, { value: 1, label: '已发货' }, { value: 2, label: '部分入库' }, { value: 3, label: '已入库' }, { value: 4, label: '已作废' }
];
const statusMeta = (status?: number) => ({
  label: statuses.find((item) => item.value === status)?.label || '未知',
  type: status === 3 ? 'success' : status === 2 ? 'warning' : status === 4 ? 'danger' : status === 1 ? 'primary' : 'info'
} as any);
const query = reactive<any>({ pageNum: 1, pageSize: 20 });
const rows = ref<SupplierDeliveryOrder[]>([]);
const total = ref(0);
const loading = ref(false);
const editorVisible = ref(false);
const readonly = ref(false);
const saving = ref(false);
const formRef = ref<ElFormInstance>();
const emptyForm = (): SupplierDeliveryOrder => ({ supplierCode: '', details: [], shippingDate: new Date().toISOString().slice(0, 10) });
const form = ref<SupplierDeliveryOrder>(emptyForm());
const rules = { supplierCode: [{ required: true, message: '请选择采购订单', trigger: 'change' }], shippingDate: [{ required: true, message: '请选择发货日期', trigger: 'change' }] };
const purchaseVisible = ref(false);
const purchaseLoading = ref(false);
const purchaseRows = ref<PurchaseLine[]>([]);
const purchaseSelection = ref<PurchaseLine[]>([]);
const purchaseTotal = ref(0);
const purchaseQuery = reactive<any>({ pageNum: 1, pageSize: 10 });
const printTarget = ref<SupplierDeliveryOrder>();
const labelPrintRef = ref<InstanceType<typeof SupplierLabelPrint>>();
const receiptPrintRef = ref<InstanceType<typeof ReceiptPrint>>();
const deliveryNotePrintRef = ref<InstanceType<typeof DeliveryNotePrint>>();
const labelVisible = ref(false);
const labelSelection = ref<SupplierDeliveryDetail[]>([]);

const loadList = async () => {
  loading.value = true;
  try { const res = await listSupplierDeliveryOrder(query); rows.value = res.rows; total.value = res.total; } finally { loading.value = false; }
};
const resetQuery = () => { Object.assign(query, { pageNum: 1, pageSize: 20, deliveryOrderNo: undefined, supplierCode: undefined, status: undefined }); loadList(); };
const openCreate = () => { form.value = emptyForm(); readonly.value = false; editorVisible.value = true; };
const fetchFullOrder = async (row: SupplierDeliveryOrder) => (await getSupplierDeliveryOrder(row.id!)).data;
const viewOrder = async (row: SupplierDeliveryOrder) => { form.value = await fetchFullOrder(row); readonly.value = true; editorVisible.value = true; };
const editOrder = async (row: SupplierDeliveryOrder) => { form.value = await fetchFullOrder(row); readonly.value = false; editorVisible.value = true; };
const loadPurchaseLines = async () => {
  purchaseLoading.value = true;
  try { const res = await listAuthorizedPurchaseLines(purchaseQuery); purchaseRows.value = res.rows; purchaseTotal.value = res.total; } finally { purchaseLoading.value = false; }
};
watch(purchaseVisible, (value) => value && loadPurchaseLines());
const appendPurchaseLines = () => {
  if (!purchaseSelection.value.length) return proxy?.$modal.msgWarning('请选择采购订单行');
  const supplierCode = purchaseSelection.value[0].supplierCode || '';
  if (form.value.supplierCode && form.value.supplierCode !== supplierCode) return proxy?.$modal.msgWarning('一张送货单只能包含同一供应商');
  if (purchaseSelection.value.some((line) => line.supplierCode !== supplierCode)) return proxy?.$modal.msgWarning('请选择同一供应商的采购订单');
  form.value.supplierCode = supplierCode;
  form.value.supplierName = purchaseSelection.value[0].supplierName;
  purchaseSelection.value.forEach((line) => form.value.details.push({
    poNumber: line.poNumber, itemNumber: line.itemNumber, scheduleNumber: line.scheduleNumber, materialCode: line.materialCode,
    materialDesc: line.materialDesc, quantity: Number(line.openQuantity || 0), unit: line.orderUnit, batchCode: '', packageMethod: '纸箱'
  }));
  purchaseVisible.value = false;
};
const splitLine = async (row: SupplierDeliveryDetail, index: number) => {
  const result = await ElMessageBox.prompt('输入该包装行要拆分成的标签份数（总数量保持不变）', '按份数拆分', {
    inputValue: '2', inputPattern: /^([2-9]|[1-9]\d)$/, inputErrorMessage: '请输入2到99之间的整数'
  }).catch(() => undefined);
  if (!result) return;
  const count = Number(result.value);
  const totalQty = Number(row.quantity);
  const baseQty = Math.floor((totalQty / count) * 1000) / 1000;
  const parts = Array.from({ length: count }, (_, partIndex) => ({
    ...row, id: undefined, labelCode: undefined,
    quantity: partIndex === count - 1 ? Number((totalQty - baseQty * (count - 1)).toFixed(3)) : baseQty
  }));
  form.value.details.splice(index, 1, ...parts);
};
const validateDetails = () => {
  if (!form.value.details.length) return '请添加包装标签明细';
  if (form.value.details.some((line) => !line.batchCode || !(Number(line.quantity) > 0))) return '每个包装必须填写大于0的数量和供应商批次';
  return '';
};
const saveOrder = async () => {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return;
  const message = validateDetails(); if (message) return proxy?.$modal.msgWarning(message);
  saving.value = true;
  try {
    form.value.details.forEach((line, index) => { line.packageNo = index + 1; line.packageCount = form.value.details.length; });
    if (form.value.id) await updateSupplierDeliveryOrder(form.value); else await addSupplierDeliveryOrder(form.value);
    proxy?.$modal.msgSuccess('送货单已保存'); editorVisible.value = false; await loadList();
  } finally { saving.value = false; }
};
const printOrderLabels = async (row: SupplierDeliveryOrder) => { printTarget.value = await fetchFullOrder(row); labelSelection.value = []; labelVisible.value = true; };
const confirmLabelPrint = async () => {
  const ids = labelSelection.value.map((line) => line.id!).filter(Boolean);
  await labelPrintRef.value?.printLabels(ids);
  await recordSupplierLabelPrint(ids);
  proxy?.$modal.msgSuccess(labelSelection.value.some((line) => Number(line.printCount || 0) > 0) ? '补打印已记录' : '标签打印已记录');
  const target = printTarget.value;
  if (target?.id) printTarget.value = await fetchFullOrder(target);
};
const printReceipt = async (row: SupplierDeliveryOrder) => receiptPrintRef.value?.printReceipt(await fetchFullOrder(row));
const printDeliveryNote = async (row: SupplierDeliveryOrder) => deliveryNotePrintRef.value?.printDeliveryNote(await fetchFullOrder(row));
const submitOrder = async (row: SupplierDeliveryOrder) => { await proxy?.$modal.confirm(`确认送货单 ${row.deliveryOrderNo} 已发货？`); await submitSupplierDeliveryOrder(row.id!); proxy?.$modal.msgSuccess('已确认发货'); loadList(); };
const removeOrder = async (row: SupplierDeliveryOrder) => { await proxy?.$modal.confirm(`确认删除草稿 ${row.deliveryOrderNo}？`); await deleteSupplierDeliveryOrder(row.id!); proxy?.$modal.msgSuccess('删除成功'); loadList(); };
onMounted(loadList);
</script>

<style scoped>
.detail-toolbar { display:flex; align-items:center; justify-content:space-between; margin:10px 0; }
</style>
