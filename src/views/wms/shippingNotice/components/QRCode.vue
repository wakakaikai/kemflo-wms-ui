<template>
  <canvas v-show="props.type != 'DataURL'" ref="canvas"></canvas>
  <img :src="qrCodeDataURL" alt="二维码" />
</template>

<script setup name="QRCode" lang="ts">
import QRCode from 'qrcode';
import { ref, defineProps } from 'vue';
const qrCodeDataURL = ref('');
interface Props {
  value: string; // 二维码的内容值。
  size?: number; // 二维码大小。
  margin?: number; // 定义空白区的宽度应该是多少。
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // 维码的容错能力等级，取值为 'L', 'M', 'Q', 'H' 之一。
  dark?: string; // 二维码前景颜色。
  light?: string; // 二维码背景颜色。
  type?: string; // 二维码显示格式DataURL、Canvas、SVG
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  size: 100,
  margin: 5,
  level: 'M',
  light: '#fff',
  dark: '#000',
  type: 'DataURL'
});

const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  nextTick(() => {
    const canvasDom = canvas.value as HTMLCanvasElement;
    switch (props.type) {
      case 'DataURL':
        QRCode.toDataURL(props.value, {
          errorCorrectionLevel: props.errorCorrectionLevel,
          width: props.size,
          margin: props.margin,
          color: {
            dark: props.dark,
            light: props.light
          }
        })
          .then((url) => {
            qrCodeDataURL.value = url;
          })
          .catch((error) => {
            console.error('生成二维码时发生错误: ', error);
          });
        break;
      case 'SVG':
        QRCode.toString(props.value, {
          errorCorrectionLevel: props.errorCorrectionLevel,
          width: props.size,
          margin: props.margin,
          color: {
            dark: props.dark,
            light: props.light
          }
        })
          .then((canvas) => {
            console.log(canvas);
            canvasDom.append(canvas);
          })
          .catch((err) => {
            console.log(err);
          });
        break;
      default:
        QRCode.toCanvas(
          canvasDom,
          props.value,
          {
            errorCorrectionLevel: props.errorCorrectionLevel,
            width: props.size,
            margin: props.margin,
            color: {
              dark: props.dark,
              light: props.light
            }
          },
          (error: any) => {
            if (error) {
              console.error('生成二维码时发生错误: ', error);
            }
          }
        );
    }
  });
});
</script>
