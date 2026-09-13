<template>
  <div v-loading="loading" class="number-edit-page p-2">
    <div class="number-edit-page__actions">
      <el-button plain icon="ArrowLeft" size="small" @click="goBack">返回</el-button>
      <el-button type="primary" icon="Check" size="small" :loading="editorRef?.buttonLoading" @click="handleSave">保存</el-button>
    </div>
    <NumberRuleEditor ref="editorRef" :id="id" @loaded="loading = false" @saved="goBack" />
  </div>
</template>

<script setup name="NumberEdit" lang="ts">
import NumberRuleEditor from './components/number-rule-editor.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const vueRouter = useRouter();

const id = computed(() => route.params.id as string | undefined);
const loading = ref(true);
const editorRef = ref<InstanceType<typeof NumberRuleEditor>>();

const handleSave = () => {
  editorRef.value?.submit();
};

const goBack = () => {
  if (proxy?.$tab?.closePage) {
    proxy.$tab.closePage();
    return;
  }
  vueRouter.back();
};
</script>

<style scoped>
.number-edit-page {
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
}

.number-edit-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 8px;
  margin-bottom: 8px;
  background: #fff;
}
</style>
