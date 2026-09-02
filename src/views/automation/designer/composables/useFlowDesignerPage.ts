import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type AutomationDesigner from '@/components/AutomationDesigner/index.vue';
import { getDefinition, updateDefinition } from '@/api/automation/definition';
import type { AutoDefinitionForm } from '@/api/automation/definition/types';
import { listVersion } from '@/api/automation/version';
import type { AutoVersionVo } from '@/api/automation/version/types';

export function useFlowDesignerPage() {
  const route = useRoute();
  const router = useRouter();
  const definitionId = ref<string | undefined>(
    route.params.definitionId ? String(route.params.definitionId) : undefined,
  );
  const designerRef = ref<InstanceType<typeof AutomationDesigner>>();
  const saving = ref(false);
  const issueCount = ref(0);
  const historyVisible = ref(false);
  const historyLoading = ref(false);
  const historyTotal = ref(0);
  const historyList = ref<AutoVersionVo[]>([]);
  const historyQuery = reactive({ pageNum: 1, pageSize: 10, definitionId: definitionId.value });

  const form = reactive<AutoDefinitionForm>({
    automationCode: undefined,
    automationName: undefined,
    triggerType: undefined,
    description: undefined,
  });

  function syncDefinitionIdFromRoute() {
    const id = route.params.definitionId ? String(route.params.definitionId) : undefined;
    definitionId.value = id;
    historyQuery.definitionId = id;
  }

  async function loadDefinition() {
    if (!definitionId.value) return;
    try {
      const res = await getDefinition(definitionId.value);
      Object.assign(form, res.data);
    } catch {
      // keep designer usable even if metadata loading fails
    }
  }

  async function renameFlow() {
    try {
      const { value } = await ElMessageBox.prompt('请输入流程名称', '修改名称', {
        inputValue: form.automationName || '',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: (value) => (value?.trim() ? true : '名称不能为空'),
      });
      const name = value?.trim();
      if (!name) return;
      form.automationName = name;
      if (definitionId.value) {
        await updateDefinition({ ...form, id: definitionId.value });
      }
      ElMessage.success('名称已保存');
    } catch {
      // cancelled
    }
  }

  async function handleSave() {
    saving.value = true;
    try {
      await designerRef.value?.save();
    } finally {
      saving.value = false;
    }
  }

  async function handleValidate() {
    issueCount.value = 0;
    await designerRef.value?.validate();
  }

  function handleRun() {
    designerRef.value?.run();
  }

  async function loadHistory() {
    if (!definitionId.value) return;
    historyLoading.value = true;
    try {
      const res = await listVersion({
        definitionId: definitionId.value,
        pageNum: historyQuery.pageNum,
        pageSize: historyQuery.pageSize,
      } as any);
      historyList.value = (res as any).rows ?? [];
      historyTotal.value = (res as any).total ?? 0;
    } finally {
      historyLoading.value = false;
    }
  }

  function handleSaved() {
    ElMessage.success('设计已保存');
  }

  function goBack() {
    router.push({ path: '/automation/definition' });
  }

  onMounted(() => {
    syncDefinitionIdFromRoute();
    loadDefinition();
  });

  watch(
    () => route.params.definitionId,
    () => {
      syncDefinitionIdFromRoute();
      loadDefinition();
    },
  );

  return {
    definitionId,
    designerRef,
    saving,
    issueCount,
    historyVisible,
    historyLoading,
    historyTotal,
    historyList,
    historyQuery,
    form,
    renameFlow,
    handleSave,
    handleValidate,
    handleRun,
    loadHistory,
    handleSaved,
    goBack,
  };
}
