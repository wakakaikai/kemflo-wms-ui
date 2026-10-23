<template>
  <div class="receive-workbench">
    <el-card shadow="never">
      <template #header>
        <div class="header-row">
          <div><b>供应商收货工作台</b><span class="sub-title">独立于工单入库标签</span></div>
          <el-tag type="success" effect="plain" size="large">自动识别收货单 / 供应商标签</el-tag>
        </div>
      </template>

      <el-alert :title="scanHelp" type="info" show-icon :closable="false" class="mb-4" />
      <el-row :gutter="18">
        <el-col :span="8">
          <el-form label-width="105px">
            <el-form-item label="表头默认库位">
              <el-input ref="locationRef" v-model="defaultLocation" size="large" placeholder="可扫描库位；明细可单独覆盖" @keyup.enter="focusScanner" />
            </el-form-item>
            <el-form-item label="扫码内容">
              <el-input ref="scannerRef" v-model="scanCode" size="large" autofocus placeholder="扫描收货单或供应商标签" @keyup.enter="handleScan" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="resolving" @click="handleScan">确认扫码</el-button>
              <el-button size="large" @click="applyDefaultLocation">默认库位应用全部</el-button>
              <el-button size="large" @click="resetSession">清空本次收货</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="16">
          <div class="supplier-summary">
            <div v-for="group in supplierGroups" :key="group.key" class="supplier-card">
              <div class="supplier-name">{{ group.supplierCode }} · {{ group.supplierName }}</div>
              <div>送货单 {{ group.orderCount }} 张</div><div>计划 {{ group.planCount }} 箱</div>
              <div>本次已扫 <b>{{ group.scannedCount }}</b> 箱</div><div>已入库 {{ group.receivedCount }} 箱</div>
            </div>
            <el-empty v-if="!supplierGroups.length" description="等待扫码" :image-size="55" />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-if="orderProgress.length" shadow="never" class="mt-2">
      <template #header><b>收货单对照与进度</b></template>
      <el-table :data="orderProgress" border>
        <el-table-column prop="supplierCode" label="供应商" width="120" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="180" />
        <el-table-column prop="deliveryOrderNo" label="送货单号" width="190" />
        <el-table-column label="对单状态" width="105">
          <template #default="{ row }"><el-tag :type="row.verified ? 'success' : 'warning'">{{ row.verified ? '已扫单据' : '待扫单据' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="total" label="计划箱数" width="90" align="right" />
        <el-table-column prop="received" label="历史已收" width="90" align="right" />
        <el-table-column prop="scanned" label="本次已扫" width="90" align="right" />
        <el-table-column prop="pending" label="待扫码" width="90" align="right" />
        <el-table-column label="进度" min-width="180">
          <template #default="{ row }"><el-progress :percentage="row.percent" :status="row.percent === 100 ? 'success' : undefined" /></template>
        </el-table-column>
      </el-table>
      <el-divider content-position="left">收货单逐标签明细进度</el-divider>
      <el-table :data="planRows" border max-height="330">
        <el-table-column prop="supplierCode" label="供应商" width="115" /><el-table-column prop="deliveryOrderNo" label="送货单" width="185" />
        <el-table-column prop="poNumber" label="采购订单" width="135" /><el-table-column prop="itemNumber" label="项次" width="65" /><el-table-column prop="scheduleNumber" label="计划行" width="75" />
        <el-table-column prop="materialCode" label="物料" width="125" /><el-table-column prop="materialDesc" label="物料描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="batchCode" label="供应商批次" width="130" /><el-table-column prop="quantity" label="数量" width="90" align="right" />
        <el-table-column label="箱号" width="75"><template #default="{row}">{{ row.packageNo }}/{{ row.packageCount }}</template></el-table-column>
        <el-table-column label="进度" width="105"><template #default="{row}"><el-tag :type="row.progressType">{{ row.progressText }}</el-tag></template></el-table-column>
        <el-table-column prop="progressLocation" label="本次/历史库位" width="125" />
      </el-table>
    </el-card>

    <el-card shadow="never" class="mt-2">
      <template #header>
        <div class="header-row"><b>本次标签明细（确认前不改变库存）</b><div><el-tag type="primary">{{ stagedRows.length }} 箱</el-tag><el-button class="ml-3" type="success" size="large" :loading="receiving" :disabled="!canReceive" @click="confirmReceive">确认收货入库</el-button></div></div>
      </template>
      <el-table :data="stagedRows" border :row-class-name="rowClassName">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="供应商" width="210"><template #default="{row}"><el-tag effect="plain">{{ row.supplierCode }}</el-tag> {{ row.supplierName }}</template></el-table-column>
        <el-table-column prop="deliveryOrderNo" label="送货单" width="185" />
        <el-table-column prop="itemNumber" label="项次" width="65" /><el-table-column prop="scheduleNumber" label="计划行" width="75" />
        <el-table-column prop="materialCode" label="物料" width="125" /><el-table-column prop="materialDesc" label="物料描述" min-width="170" show-overflow-tooltip />
        <el-table-column prop="batchCode" label="供应商批次" width="135" /><el-table-column prop="quantity" label="数量" width="90" align="right" /><el-table-column prop="unit" label="单位" width="65" />
        <el-table-column label="目标库位" width="155"><template #default="{row}"><el-input v-model="row.locationCode" placeholder="必填" /></template></el-table-column>
        <el-table-column label="对照" width="90"><template #default="{row}"><el-tag :type="verifiedOrders.has(row.deliveryOrderNo) ? 'success' : 'warning'">{{ verifiedOrders.has(row.deliveryOrderNo) ? '已对单' : '待对单' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" fixed="right" width="70"><template #default="{$index}"><el-button link type="danger" @click="stagedRows.splice($index, 1)">移除</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!stagedRows.length" description="尚未扫描供应商标签" />
    </el-card>

    <el-card v-if="anomalies.length" shadow="never" class="mt-2 anomaly-card">
      <template #header><b>扫码异常</b></template>
      <el-table :data="anomalies" size="small"><el-table-column prop="time" label="时间" width="170" /><el-table-column prop="code" label="扫码内容" min-width="220" /><el-table-column prop="message" label="异常原因" min-width="260" /><el-table-column width="65"><template #default="{$index}"><el-button link @click="anomalies.splice($index,1)">清除</el-button></template></el-table-column></el-table>
    </el-card>

    <el-dialog v-model="resultVisible" title="收货完成—A4入库单" width="70%">
      <el-alert v-if="receivedOrders.length > 1" title="本次包含多个供应商或送货单，请分别打印各自的A4入库单。" type="warning" :closable="false" class="mb-3" />
      <el-table :data="receivedOrders" border>
        <el-table-column prop="supplierCode" label="供应商" width="120" /><el-table-column prop="supplierName" label="供应商名称" min-width="190" /><el-table-column prop="deliveryOrderNo" label="送货单" width="190" /><el-table-column prop="receiptNo" label="入库单号" min-width="180" />
        <el-table-column label="操作" width="130"><template #default="{row}"><el-button type="primary" link @click="receiptPrintRef?.printReceipt(row)">打印A4入库单</el-button></template></el-table-column>
      </el-table>
      <template #footer><el-button type="primary" @click="resultVisible=false">完成</el-button></template>
    </el-dialog>
    <ReceiptPrint ref="receiptPrintRef" />
  </div>
</template>

<script setup name="SupplierDeliveryInbound" lang="ts">
import { batchScanSupplierDeliveryInbound, getSupplierDeliveryOrderByCode } from '@/api/srm/supplierDeliveryOrder';
import type { SupplierDeliveryDetail, SupplierDeliveryOrder } from '@/api/srm/supplierDeliveryOrder/types';
import ReceiptPrint from '@/views/srm/supplierDeliveryOrder/components/ReceiptPrint.vue';

interface StagedRow extends SupplierDeliveryDetail { supplierCode: string; supplierName?: string; locationCode: string; }
interface Anomaly { time: string; code: string; message: string; }

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const defaultLocation = ref('');
const scanCode = ref('');
const resolving = ref(false);
const receiving = ref(false);
const scannerRef = ref();
const locationRef = ref();
const stagedRows = ref<StagedRow[]>([]);
const orderMap = reactive(new Map<string, SupplierDeliveryOrder>());
const verifiedOrders = reactive(new Set<string>());
const anomalies = ref<Anomaly[]>([]);
const receivedOrders = ref<SupplierDeliveryOrder[]>([]);
const resultVisible = ref(false);
const receiptPrintRef = ref<InstanceType<typeof ReceiptPrint>>();

const scanHelp = '系统自动识别二维码类型：可先扫一张或多张收货单再扫标签，也可先连续扫标签、最后逐一扫描对应收货单完成对照；同一批次可处理多家供应商。';

const orderProgress = computed(() => Array.from(orderMap.values()).map((order) => {
  const details = order.details || [];
  const received = details.filter((line) => line.status === 2).length;
  const scanned = stagedRows.value.filter((line) => line.deliveryOrderNo === order.deliveryOrderNo).length;
  const total = details.length;
  return {
    supplierCode: order.supplierCode, supplierName: order.supplierName, deliveryOrderNo: order.deliveryOrderNo!,
    verified: verifiedOrders.has(order.deliveryOrderNo!), total, received, scanned,
    pending: Math.max(total - received - scanned, 0), percent: total ? Math.min(Math.round(((received + scanned) / total) * 100), 100) : 0
  };
}));

const supplierGroups = computed(() => {
  const groups = new Map<string, any>();
  orderProgress.value.forEach((order) => {
    const key = order.supplierCode;
    const group = groups.get(key) || { key, supplierCode: key, supplierName: order.supplierName, orderCount: 0, planCount: 0, scannedCount: 0, receivedCount: 0 };
    group.orderCount += 1; group.planCount += order.total; group.scannedCount += order.scanned; group.receivedCount += order.received; groups.set(key, group);
  });
  return Array.from(groups.values());
});

const planRows = computed(() => Array.from(orderMap.values()).flatMap((order) => (order.details || []).map((line) => {
  const staged = stagedRows.value.find((item) => item.labelCode === line.labelCode);
  const received = line.status === 2;
  return {
    ...line, supplierCode: order.supplierCode, supplierName: order.supplierName,
    progressText: received ? '已入库' : staged ? '本次已扫' : '待扫码',
    progressType: received ? 'success' : staged ? 'primary' : 'info',
    progressLocation: received ? line.locationCode : staged?.locationCode || '-'
  };
})));

const canReceive = computed(() => stagedRows.value.length > 0
  && stagedRows.value.every((line) => !!line.locationCode)
  && stagedRows.value.every((line) => verifiedOrders.has(line.deliveryOrderNo!)));

const focusScanner = () => nextTick(() => scannerRef.value?.focus());
const addAnomaly = (code: string, message: string) => {
  anomalies.value.unshift({ time: new Date().toLocaleString(), code, message });
  proxy?.$modal.msgError(message);
};
const resetSession = () => {
  stagedRows.value = []; orderMap.clear(); verifiedOrders.clear(); anomalies.value = []; scanCode.value = ''; focusScanner();
};
const applyDefaultLocation = () => {
  if (!defaultLocation.value) return proxy?.$modal.msgWarning('请先填写表头默认库位');
  stagedRows.value.forEach((line) => { line.locationCode = defaultLocation.value; });
};

const resolveCode = async (code: string) => (await getSupplierDeliveryOrderByCode(code)).data;
const handleOrderScan = async (code: string) => {
  const order = await resolveCode(code);
  if (!order.deliveryOrderNo) throw new Error('收货单号为空');
  orderMap.set(order.deliveryOrderNo, order);
  verifiedOrders.add(order.deliveryOrderNo);
  proxy?.$modal.msgSuccess(`已加载收货单 ${order.deliveryOrderNo}（${order.supplierName || order.supplierCode}）`);
};
const handleLabelScan = async (code: string) => {
  if (stagedRows.value.some((line) => line.labelCode === code)) throw new Error('该标签本次已扫描，请勿重复扫描');
  const order = await resolveCode(code);
  const line = order.details.find((item) => item.labelCode === code);
  if (!line) throw new Error('未找到标签明细');
  if (line.status === 2) throw new Error(`标签已入库，库位：${line.locationCode || '-'}`);
  if (line.status !== 1) throw new Error('标签对应送货单尚未发货或已作废');
  if (!orderMap.has(order.deliveryOrderNo!)) orderMap.set(order.deliveryOrderNo!, order);
  stagedRows.value.push({ ...line, supplierCode: order.supplierCode, supplierName: order.supplierName, locationCode: defaultLocation.value });
  proxy?.$modal.msgSuccess(`标签已加入：${order.supplierCode} / ${line.materialCode} / ${line.quantity}${line.unit || ''}`);
};
const handleScan = async () => {
  const code = scanCode.value.trim(); if (!code) return;
  resolving.value = true;
  try {
    if (code.startsWith('SRMDO:')) await handleOrderScan(code);
    else if (code.startsWith('SRMLB:')) await handleLabelScan(code);
    else throw new Error('无法识别二维码：收货单应以 SRMDO 开头，标签应以 SRMLB 开头');
  } catch (error: any) {
    addAnomaly(code, error?.message || '扫码解析失败');
  } finally {
    resolving.value = false; scanCode.value = ''; focusScanner();
  }
};

const confirmReceive = async () => {
  if (!canReceive.value) return;
  const supplierCount = new Set(stagedRows.value.map((line) => line.supplierCode)).size;
  await proxy?.$modal.confirm(`本次共 ${stagedRows.value.length} 箱、${supplierCount} 家供应商。确认按明细库位正式入库？`);
  receiving.value = true;
  try {
    const response = await batchScanSupplierDeliveryInbound(stagedRows.value.map((line) => ({ code: line.labelCode!, locationCode: line.locationCode })));
    receivedOrders.value = response.data;
    resultVisible.value = true;
    proxy?.$modal.msgSuccess('收货入库完成');
    stagedRows.value = [];
    receivedOrders.value.forEach((order) => orderMap.set(order.deliveryOrderNo!, order));
    if (receivedOrders.value.length === 1) {
      await nextTick(); receiptPrintRef.value?.printReceipt(receivedOrders.value[0]);
    }
  } finally { receiving.value = false; }
};
const rowClassName = ({ row }: { row: StagedRow }) => `supplier-${String(row.supplierCode).replace(/[^a-zA-Z0-9]/g, '')}`;
onMounted(() => locationRef.value?.focus());
</script>

<style scoped>
.receive-workbench{width:100%;max-width:none;margin:0;box-sizing:border-box}.header-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.sub-title{margin-left:14px;color:#909399;font-size:12px}.supplier-summary{display:flex;gap:10px;flex-wrap:wrap;min-height:110px}.supplier-card{border:1px solid var(--el-border-color);border-left:5px solid var(--el-color-primary);border-radius:6px;padding:10px 14px;display:grid;grid-template-columns:repeat(2,minmax(110px,1fr));gap:7px;background:var(--el-fill-color-lighter)}.supplier-name{grid-column:1/-1;font-weight:700;color:var(--el-color-primary)}.anomaly-card{border-color:var(--el-color-danger-light-5)}
</style>
