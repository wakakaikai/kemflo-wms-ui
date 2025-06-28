<template>
  <div class="center-iframe">
    <i-frame v-model:src="url"></i-frame>
  </div>
</template>

<script setup lang="ts" name="ReportView">
import { getToken } from '@/utils/auth';
const { proxy } = getCurrentInstance();
const url = ref(window.location.href);
onMounted(() => {
  url.value = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
  let viewEndStr = '/jmreport/view';
  let startPos = proxy.$route.path.indexOf(viewEndStr);
  if (startPos !== -1) {
    let result = proxy.$route.path.substring(startPos);
    url.value = url.value + result + '?token=Bearer ' + getToken();
  }
});
</script>
