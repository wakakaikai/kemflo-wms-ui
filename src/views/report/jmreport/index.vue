<template>
  <div>
    <i-frame v-model:src="url"></i-frame>
  </div>
</template>

<script setup lang="ts">
import { getToken } from '@/utils/auth';
const url = ref(import.meta.env.VITE_APP_JMREPORT_ADMIN);
</script>
