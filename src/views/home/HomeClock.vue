<template>
  <span class="home-clock">{{ currentDateTime }}</span>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const currentDateTime = ref('');
let clockTimer: ReturnType<typeof setInterval> | null = null;

const updateDateTime = () => {
  currentDateTime.value = new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    .replace(/\//g, '-');
};

onMounted(() => {
  updateDateTime();
  clockTimer = setInterval(updateDateTime, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<style scoped>
.home-clock {
  font-variant-numeric: tabular-nums;
}
</style>
