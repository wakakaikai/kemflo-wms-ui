<template>
  <div :id="printId" class="print-host">
    <article v-if="printOrder" class="receipt-sheet">
      <div class="title-row">
        <div>
          <h1>采购入库单</h1>
          <p>入库单号：{{ printOrder.receiptNo || '-' }}</p>
          <p>送货单号：{{ printOrder.deliveryOrderNo }}</p>
        </div>
        <img :src="qrCode" class="receipt-qr" alt="入库单明细二维码" />
      </div>
      <div class="summary">
        <span>供应商：{{ printOrder.supplierCode }} {{ printOrder.supplierName }}</span>
        <span>发货日期：{{ printOrder.shippingDate || '-' }}</span>
        <span>入库时间：{{ printOrder.receivedTime || printTime }}</span>
        <span>物流单号：{{ printOrder.trackingNo || '-' }}</span>
      </div>
      <table>
        <thead><tr><th>序号</th><th>采购订单/行</th><th>物料</th><th>批次</th><th>送货数量</th><th>实收数量</th><th>库位</th><th>状态</th></tr></thead>
        <tbody>
          <tr v-for="(line, index) in printOrder.details" :key="line.id">
            <td>{{ index + 1 }}</td><td>{{ line.poNumber }}/{{ line.itemNumber }}</td>
            <td>{{ line.materialCode }}<br />{{ line.materialDesc }}</td><td>{{ line.batchCode }}</td>
            <td>{{ line.quantity }} {{ line.unit }}</td><td>{{ line.receivedQuantity || 0 }} {{ line.unit }}</td>
            <td>{{ line.locationCode || '-' }}</td><td>{{ line.status === 2 ? '已入库' : '待入库' }}</td>
          </tr>
        </tbody>
      </table>
      <div class="signatures"><span>送货人：</span><span>收货人：</span><span>复核人：</span><span>日期：</span></div>
      <p class="hint">扫描右上角二维码可在 WMS 中带出本单完整明细。</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';
import printJS from 'print-js';
import type { SupplierDeliveryOrder } from '@/api/srm/supplierDeliveryOrder/types';

const printId = `supplier-receipt-${Math.random().toString(36).slice(2)}`;
const printOrder = ref<SupplierDeliveryOrder>();
const qrCode = ref('');
const printTime = new Date().toLocaleString();

const printReceipt = async (order: SupplierDeliveryOrder) => {
  printOrder.value = order;
  qrCode.value = await QRCode.toDataURL(`SRMDO:${order.deliveryOrderNo}`, { width: 240, margin: 0 });
  await nextTick();
  printJS({
    printable: printId,
    type: 'html', targetStyles: ['*'], scanStyles: false,
    style: `
      @page { size:A4 portrait; margin:12mm; } .print-host{display:block!important;position:static!important}
      .receipt-sheet{font-family:"Microsoft YaHei",sans-serif;color:#000;font-size:10pt}.title-row{display:flex;justify-content:space-between;align-items:flex-start}
      h1{font-size:22pt;margin:0 0 5mm}.title-row p{margin:1mm 0}.receipt-qr{width:30mm;height:30mm}.summary{display:grid;grid-template-columns:1fr 1fr;gap:2mm;border:1px solid #000;padding:3mm;margin:4mm 0}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:2mm;text-align:center;word-break:break-all}th{background:#eee}.signatures{display:grid;grid-template-columns:repeat(4,1fr);margin-top:12mm}.hint{text-align:right;margin-top:8mm;font-size:8pt}
    `
  });
};
defineExpose({ printReceipt });
</script>

<style scoped>.print-host{position:fixed;left:-20000px;top:0}</style>
