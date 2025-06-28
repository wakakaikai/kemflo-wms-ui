<template>
  <div class="flex-container">
    <el-image ref="image" class="barcodeClass" fit="scale-down" :src="barcodeUrl">
      <template #error>
        <div class="image-slot">
          <el-icon><Picture /></el-icon>
        </div>
      </template>
    </el-image>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
// import { getBarcodeUrl } from '@/api/MesOperatePanel/wm/barcode';
import { ElImage, ElIcon } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';

// 定义 Props
interface Props {
  bussinessId?: number;
  bussinessCode?: string | null;
  barcodeFormart?: string;
  barcodeType?: string | null;
}
const props = defineProps<Props>();

// 默认值处理
const bussinessId = props.bussinessId ?? -1;
const barcodeFormart = props.barcodeFormart ?? 'QR_CODE';

const barcodeUrl = ref<string>('');

// 监听 bussinessCode 的变化获取二维码
watch(
  () => props.bussinessCode,
  (newCode) => {
    if (newCode) {
      getBarcode();
    }
  },
  { immediate: true }
);

// 获取二维码地址
const getBarcode = () => {
  console.log('---------------------', props.barcodeType);

  if (!props.bussinessCode) {
    return;
  }

  const barcodeParams = {
    bussinessId: bussinessId,
    bussinessCode: props.bussinessCode,
    barcodeFormart: barcodeFormart,
    barcodeType: props.barcodeType
  };

  // getBarcodeUrl(barcodeParams).then((response) => {
  //   console.log(response, '59');
  //   if (response.data?.barcodeUrl) {
  //     barcodeUrl.value = response.data.barcodeUrl;
  //     console.log(barcodeUrl.value, '63');
  //   }
  // });
};
</script>
<style scoped>
.barcodeClass {
  width: 200px;
  height: 200px;
  border: 1px dashed;
  position: relative;
  display: inline-block;
}

.flex-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
