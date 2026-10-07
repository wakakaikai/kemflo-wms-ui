<template>
  <div v-loading="loading" class="nc-group-editor">
    <div class="action-bar"><el-button icon="ArrowLeft" :disabled="saving" @click="goBack">返回</el-button><el-button type="primary" icon="Check" :loading="saving" :disabled="!ready || loading" @click="handleSave">保存</el-button></div>
    <el-alert v-if="loadFailed" title="不合格组信息加载失败，请重新加载后操作" type="error" :closable="false" show-icon><el-button type="primary" link @click="loadData">重新加载</el-button></el-alert>
    <template v-else>
      <el-card shadow="never" class="section-card">
        <template #header><div class="section-title">基本信息</div></template>
        <el-form ref="formRef" :model="form" :rules="rules" :disabled="saving" label-width="150px">
          <el-row :gutter="40">
            <el-col :xs="24" :lg="12"
              ><el-form-item label="不合格组" prop="ncGroup"><el-input v-model="form.ncGroup" :disabled="isEdit" placeholder="请输入不合格组" maxlength="100" /></el-form-item
            ></el-col>
            <el-col :xs="24" :lg="12"
              ><el-form-item label="描述" prop="description"><el-input v-model="form.description" placeholder="请输入描述" maxlength="200" clearable /></el-form-item
            ></el-col>
            <el-col :xs="24" :lg="12"
              ><el-form-item label="对所有工序有效" prop="validAtAllOperations"><el-switch v-model="form.validAtAllOperations" active-value="true" inactive-value="false" /></el-form-item
            ></el-col>
            <el-col :xs="24" :lg="12"
              ><el-form-item label="筛选优先级" prop="priority"><el-input-number v-model="form.priority" :min="0" :max="2147483647" :precision="0" controls-position="right" /></el-form-item
            ></el-col>
            <el-col :span="24"
              ><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入备注" /></el-form-item
            ></el-col>
          </el-row>
        </el-form>
      </el-card>
      <el-card shadow="never" class="section-card">
        <template #header><div class="section-title">不合格代码</div></template>
        <div class="member-panel" :class="{ 'is-saving': saving }">
          <el-transfer v-model="form.ncCodeBoList" :data="transferOptions" :titles="['可用不合格代码', '已分配不合格代码']" filterable filter-placeholder="搜索代码或描述" target-order="push">
            <template #default="{ option }"
              ><span :title="option.label">{{ option.label }}</span></template
            >
          </el-transfer>
        </div>
        <p class="member-tip">保存时同步更新成员关联；已分配代码按右侧显示顺序保存。移除关联不会删除不合格代码。</p>
      </el-card>
    </template>
  </div>
</template>

<script setup name="NcGroupEdit" lang="ts">
import { addNcGroup, getNcGroup, listNcGroupCodeOptions, updateNcGroup } from '@/api/mes/ncGroup';
import type { NcGroupForm } from '@/api/mes/ncGroup/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const saving = ref(false);
const ready = ref(false);
const loadFailed = ref(false);
const formRef = ref<ElFormInstance>();
const codeOptions = ref<Array<{ key: string; label: string; disabled?: boolean }>>([]);
const transferOptions = computed(() => codeOptions.value.map((option) => ({ ...option, disabled: saving.value })));
const defaults = (): NcGroupForm => ({ id: undefined, ncGroup: '', description: '', validAtAllOperations: 'true', priority: 0, remark: '', ncCodeBoList: [] });
const form = reactive<NcGroupForm>(defaults());
const rules = {
  ncGroup: [
    { required: true, message: '不合格组不能为空', trigger: 'blur' },
    { pattern: /^[^,:\s]+$/, message: '不合格组不能包含空白、逗号或冒号', trigger: 'blur' }
  ],
  priority: [{ required: true, message: '筛选优先级不能为空', trigger: 'change' }]
};

const loadData = async () => {
  loading.value = true;
  ready.value = false;
  loadFailed.value = false;
  try {
    const [codes, detail] = await Promise.all([listNcGroupCodeOptions(), isEdit.value ? getNcGroup(route.params.id as string) : Promise.resolve(undefined)]);
    const data = detail?.data;
    if (isEdit.value && !data) throw new Error('不合格组不存在');
    Object.assign(
      form,
      defaults(),
      data
        ? {
            id: data.id,
            ncGroup: data.ncGroup || '',
            description: data.description || '',
            validAtAllOperations: data.validAtAllOperations || 'true',
            priority: data.priority ?? 0,
            remark: data.remark || '',
            ncCodeBoList: [...new Set(data.ncCodeBoList || [])]
          }
        : {}
    );
    const options = new Map<string, { key: string; label: string }>();
    for (const code of codes.data || []) {
      if (code.handle) options.set(code.handle, { key: code.handle, label: [code.ncCode || code.handle, code.description].filter(Boolean).join(' — ') });
    }
    // 历史成员对应的代码被删除时仍可展示、保留或移除，不因选项缺失丢失关联。
    for (const handle of form.ncCodeBoList) {
      if (!options.has(handle)) options.set(handle, { key: handle, label: `${handle}（代码信息缺失）` });
    }
    codeOptions.value = [...options.values()];
    ready.value = true;
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
};
const goBack = () => {
  if (proxy?.$tab) proxy.$tab.closeOpenPage({ path: '/mes/ncGroup' });
  else router.push('/mes/ncGroup');
};
const handleSave = async () => {
  if (!ready.value || loading.value || saving.value) return;
  saving.value = true;
  try {
    if (!(await formRef.value?.validate().catch(() => false))) return;
    const payload: NcGroupForm = { ...form, ncCodeBoList: [...form.ncCodeBoList] };
    if (isEdit.value) await updateNcGroup(payload);
    else await addNcGroup(payload);
    proxy?.$modal.msgSuccess('保存成功');
    goBack();
  } finally {
    saving.value = false;
  }
};
onMounted(loadData);
</script>

<style scoped>
.nc-group-editor {
  padding: 12px;
  min-height: calc(100vh - 84px);
  background: #f3f4f7;
}
.action-bar {
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fff;
}
.section-card {
  margin-bottom: 10px;
  border: 0;
}
.section-title {
  padding-left: 10px;
  border-left: 4px solid #315eb5;
  font-size: 18px;
  font-weight: 600;
  color: #244a90;
}
.member-panel {
  overflow-x: auto;
  padding: 8px 0;
}
.member-panel :deep(.el-transfer) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 760px;
}
.member-panel :deep(.el-transfer-panel) {
  width: 320px;
}
.member-panel :deep(.el-transfer-panel__body),
.member-panel :deep(.el-transfer-panel__list.is-filterable) {
  height: 360px;
}
.member-panel :deep(.el-transfer-panel__item.el-checkbox) {
  display: flex;
}
.member-panel :deep(.el-checkbox__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}
.is-saving {
  pointer-events: none;
  opacity: 0.7;
}
.member-tip {
  margin-bottom: 0;
  font-size: 13px;
  color: #909399;
}
</style>
