<template>
  <div :id="printId" class="print-host">
    <article v-if="printOrder" class="delivery-sheet">
      <div class="title-row">
        <div><h1>供应商送货单</h1><p>送货单号：{{ printOrder.deliveryOrderNo }}</p><p>预计到货：{{ printOrder.plannedArrivalDate || '-' }}</p></div>
        <img :src="qrCode" class="document-qr" alt="送货单二维码" />
      </div>
      <div class="summary">
        <span>供应商：{{ printOrder.supplierCode }} {{ printOrder.supplierName }}</span><span>发货日期：{{ printOrder.shippingDate || '-' }}</span>
        <span>联系人：{{ printOrder.contactPerson || '-' }} {{ printOrder.contactPhone || '' }}</span><span>物流：{{ printOrder.carrier || '-' }} / {{ printOrder.trackingNo || '-' }}</span>
        <span>车牌号：{{ printOrder.vehicleNo || '-' }}</span><span>包装总数：{{ printOrder.totalPackages || printOrder.details.length }}</span>
      </div>
      <table>
        <thead><tr><th>标签行</th><th>采购订单</th><th>项次/计划行</th><th>物料</th><th>供应商批次</th><th>数量</th><th>箱号</th></tr></thead>
        <tbody><tr v-for="line in printOrder.details" :key="line.labelCode"><td>{{ line.lineNo }}</td><td>{{ line.poNumber }}</td><td>{{ line.itemNumber }}/{{ line.scheduleNumber || '-' }}</td><td>{{ line.materialCode }}<br />{{ line.materialDesc }}</td><td>{{ line.batchCode }}</td><td>{{ line.quantity }} {{ line.unit }}</td><td>{{ line.packageNo }}/{{ line.packageCount }}</td></tr></tbody>
      </table>
      <div class="signatures"><span>送货人：</span><span>承运人：</span><span>供应商盖章：</span><span>日期：</span></div>
      <p class="hint">收货模式一：到货后请先扫描右上角送货单二维码，再逐箱扫描97×84供应商标签。</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';
import printJS from 'print-js';
import type { SupplierDeliveryOrder } from '@/api/srm/supplierDeliveryOrder/types';
const printId = `supplier-delivery-note-${Math.random().toString(36).slice(2)}`;
const printOrder = ref<SupplierDeliveryOrder>(); const qrCode = ref('');
const printDeliveryNote = async (order: SupplierDeliveryOrder) => {
  printOrder.value = order; qrCode.value = await QRCode.toDataURL(`SRMDO:${order.deliveryOrderNo}`, { width: 240, margin: 0 }); await nextTick();
  printJS({ printable: printId, type: 'html', targetStyles: ['*'], scanStyles: false, style: `
    @page{size:A4 portrait;margin:12mm}.print-host{display:block!important;position:static!important}.delivery-sheet{font-family:"Microsoft YaHei",sans-serif;color:#000;font-size:10pt}.title-row{display:flex;justify-content:space-between}.title-row h1{font-size:22pt;margin:0 0 5mm}.title-row p{margin:1mm 0}.document-qr{width:30mm;height:30mm}.summary{display:grid;grid-template-columns:1fr 1fr;gap:2mm;border:1px solid #000;padding:3mm;margin:4mm 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:2mm;text-align:center;word-break:break-all}th{background:#eee}.signatures{display:grid;grid-template-columns:repeat(4,1fr);margin-top:12mm}.hint{text-align:right;margin-top:8mm;font-size:8pt}` });
};
defineExpose({ printDeliveryNote });
</script>
<style scoped>.print-host{position:fixed;left:-20000px;top:0}</style>
