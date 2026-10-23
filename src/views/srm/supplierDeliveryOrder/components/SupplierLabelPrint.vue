<template>
  <div :id="printId" class="print-host">
    <section v-for="line in printableLines" :key="line.labelCode" class="supplier-label">
      <header>科勒公司供应商物料标签</header>
      <div class="label-body">
        <div class="fields">
          <p><b>物料名称：</b>{{ line.materialDesc || '-' }}</p>
          <p><b>物料料号：</b>{{ line.materialCode }}</p>
          <p><b>物料批次号：</b>{{ line.batchCode }}</p>
          <p><b>生产日期：</b>{{ line.productionDate || '-' }}</p>
          <p><b>数量：</b>{{ line.quantity }} {{ line.unit || '' }}</p>
          <p><b>采购订单编号：</b>{{ line.poNumber }}</p>
        </div>
        <img class="qr" :src="line.qrCode" alt="包装标签二维码" />
      </div>
      <div class="meta-grid">
        <span><b>规格：</b>{{ line.specification || '-' }}</span>
        <span><b>包装方式：</b>{{ line.packageMethod || '-' }}</span>
        <span><b>箱号：</b>{{ line.packageNo }}/{{ line.packageCount }}</span>
        <span><b>版本号：</b>V01</span>
      </div>
      <footer><b>供应商名称：</b>{{ order?.supplierName || order?.supplierCode }}</footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';
import printJS from 'print-js';
import type { SupplierDeliveryOrder } from '@/api/srm/supplierDeliveryOrder/types';

const props = defineProps<{ order?: SupplierDeliveryOrder }>();
const printId = `supplier-label-${Math.random().toString(36).slice(2)}`;
const printableLines = ref<any[]>([]);

const printLabels = async (ids?: Array<string | number>) => {
  const source = props.order?.details || [];
  const lines = ids?.length ? source.filter((line) => line.id && ids.includes(line.id)) : source;
  printableLines.value = await Promise.all(
    lines.map(async (line) => ({ ...line, qrCode: await QRCode.toDataURL(line.labelCode || '', { width: 220, margin: 0 }) }))
  );
  await nextTick();
  printJS({
    printable: printId,
    type: 'html',
    targetStyles: ['*'],
    scanStyles: false,
    style: `
      @page { size: 97mm 84mm; margin: 0; }
      .print-host { display:block!important; position:static!important; }
      .supplier-label { box-sizing:border-box; width:97mm; height:84mm; padding:4mm; page-break-after:always; font-family:"Microsoft YaHei",sans-serif; color:#000; }
      .supplier-label header { text-align:center; font-size:15pt; font-weight:700; border-bottom:1px solid #000; padding-bottom:2mm; }
      .label-body { display:flex; min-height:47mm; padding-top:2mm; }
      .fields { flex:1; min-width:0; }
      .fields p { margin:0 0 2mm; font-size:10.5pt; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .qr { width:29mm; height:29mm; margin:3mm 0 0 2mm; }
      .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.2mm 3mm; font-size:9pt; border-top:1px solid #000; padding-top:1.5mm; }
      .supplier-label footer { margin-top:2mm; font-size:9.5pt; white-space:nowrap; overflow:hidden; }
    `
  });
};

defineExpose({ printLabels });
</script>

<style scoped>
.print-host {
  position: fixed;
  left: -20000px;
  top: 0;
}
</style>
