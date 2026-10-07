<template>
  <div v-loading="loading" class="nc-code-editor">
    <div class="action-bar">
      <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
      <el-button type="primary" icon="Check" :loading="saving" :disabled="loading || groupsLoading" @click="handleSave">保存</el-button>
    </div>

    <el-card shadow="never" class="info-card">
      <template #header><div class="section-title">不合格代码信息</div></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="80">
          <el-col :span="12">
            <el-form-item label="不合格代码" prop="ncCode">
              <el-input v-model="form.ncCode" :disabled="isEdit" placeholder="请输入不合格代码" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" maxlength="200" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" class="maintenance-tabs">
      <el-tab-pane label="主要" name="main">
        <el-form :model="form" label-width="190px" class="main-form">
          <el-row :gutter="42">
            <el-col :xs="24" :lg="12">
              <el-form-item label="状态">
                <el-select v-model="form.status" placeholder="请选择状态" class="w-full">
                  <el-option v-for="dict in mes_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="分类">
                <el-select v-model="form.ncCategory" placeholder="请选择分类" class="w-full">
                  <el-option v-for="dict in mes_nc_category" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="类别">
                <el-select v-model="form.ncType" placeholder="请选择类别" class="w-full">
                  <el-option v-for="dict in mes_nc_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="数据类型">
                <el-input v-model="form.ncDataTypeBo" placeholder="请输入数据类型" />
              </el-form-item>
              <el-form-item label="最大不合格限制">
                <el-input-number v-model="form.maxNcLimit" :min="0" :controls="false" class="w-full" />
              </el-form-item>
              <el-form-item label="严重程度">
                <el-input-number v-model="form.ncSeverityThreshold" :min="0" :controls="false" class="w-full" />
              </el-form-item>
              <el-form-item label="优先级">
                <el-input-number v-model="form.priority" :min="0" :controls="false" class="w-full" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :lg="12">
              <el-form-item label="可以是主要不合格代码">
                <el-switch v-model="form.canBePrimaryCode" active-value="true" inactive-value="false" />
              </el-form-item>
              <el-form-item label="需要关闭">
                <el-switch v-model="form.closureRequired" active-value="true" inactive-value="false" />
              </el-form-item>
              <el-form-item label="自动关闭主要不合格代码">
                <el-switch v-model="form.autoClosePrimary" active-value="true" inactive-value="false" />
              </el-form-item>
              <el-form-item label="需要次级代码才能关闭">
                <el-switch v-model="form.secondaryReqdForClose" active-value="true" inactive-value="false" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="不合格组" name="groups">
        <div v-loading="groupsLoading" class="relation-panel">
          <el-alert v-if="groupsLoadError" type="error" show-icon :closable="false">
            <template #title>不合格组加载失败，不会修改已有组关联</template>
            <el-button type="primary" link :disabled="groupsLoading || saving" @click="loadGroups">重新加载</el-button>
          </el-alert>
          <el-transfer v-else v-model="selectedGroupHandles" class="group-transfer" :data="groupTransferData" :titles="['可用不合格组', '已分配不合格组']" filterable filter-placeholder="搜索不合格组或描述" target-order="push">
            <template #default="{ option }"
              ><span :title="option.label">{{ option.label }}</span></template
            >
          </el-transfer>
        </div>
      </el-tab-pane>

      <el-tab-pane label="次要项" name="secondary">
        <div class="tab-toolbar">
          <el-button icon="Plus" disabled>新增</el-button>
          <el-button icon="Delete" disabled>删除</el-button>
        </div>
        <el-table :data="[]" border height="260">
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" width="220" align="center" />
          <el-table-column label="不合格代码" align="center" />
          <el-table-column label="描述" align="center" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="扩展字段数据" name="extFields">
        <el-table :data="extFields" border min-height="240">
          <el-table-column label="扩展字段" prop="attributeDesc" min-width="220">
            <template #default="scope"
              ><span class="required-mark">{{ scope.row.required === 'true' ? '*' : '' }}</span
              >{{ scope.row.attributeDesc || scope.row.attribute }}</template
            >
          </el-table-column>
          <el-table-column label="字段类型" prop="fieldTypeDesc" min-width="220" />
          <el-table-column label="值" min-width="500">
            <template #default="scope"><el-input v-model="scope.row.value" placeholder="请输入值" /></template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="NcCodeEdit" lang="ts">
import { addExtFields, delExtFields, listExtFields, updateExtFields } from '@/api/mes/extFields';
import { listExtFieldDef } from '@/api/mes/extFieldDef';
import { addNcCode, getNcCode, listNcCode, updateNcCode } from '@/api/mes/ncCode';
import type { NcCodeForm } from '@/api/mes/ncCode/types';
import { addNcGroupMember, delNcGroupMember, listNcGroup, listNcGroupMember } from '@/api/mes/ncGroup';
import type { NcGroupMemberVO } from '@/api/mes/ncGroup/types';

interface ExtFieldRow {
  id?: string | number;
  attribute: string;
  attributeDesc?: string;
  fieldType?: string;
  fieldTypeDesc?: string;
  required?: string;
  sequence?: number;
  value?: string;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { mes_status, mes_nc_type, mes_nc_category } = toRefs<any>(proxy?.useDict('mes_status', 'mes_nc_type', 'mes_nc_category'));

const formRef = ref<ElFormInstance>();
const loading = ref(false);
const saving = ref(false);
const activeTab = ref('main');
const extFields = ref<ExtFieldRow[]>([]);
const isEdit = computed(() => Boolean(route.params.id));
const groupsLoading = ref(false);
const groupsLoaded = ref(false);
const groupsLoadError = ref(false);
const groupOptions = ref<Array<{ key: string; label: string }>>([]);
const selectedGroupHandles = ref<string[]>([]);
const originalGroupHandles = ref<string[]>([]);
const groupTransferData = computed(() => groupOptions.value.map((group) => ({ ...group, disabled: saving.value || groupsLoading.value })));

const form = reactive<NcCodeForm>({
  id: undefined,
  handle: undefined,
  ncCode: '',
  description: '',
  status: 'ENABLED',
  ncCategory: undefined,
  ncType: undefined,
  ncSeverityThreshold: 0,
  ncDataTypeBo: undefined,
  maxNcLimit: 999999,
  priority: 500,
  canBePrimaryCode: 'true',
  closureRequired: 'false',
  autoClosePrimary: 'true',
  secondaryReqdForClose: 'false',
  remark: undefined
});

const rules: ElFormRules = {
  ncCode: [{ required: true, message: '请输入不合格代码', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
};

const loadExtFields = async (handle?: string) => {
  const [defRes, valueRes] = await Promise.all([listExtFieldDef({ tableName: 'NC_CODE', pageNum: 1, pageSize: 999 }), handle ? listExtFields({ handle, pageNum: 1, pageSize: 999 }) : Promise.resolve({ rows: [] } as any)]);
  const valueMap = new Map((valueRes.rows || []).map((item: any) => [item.attribute, item]));
  extFields.value = (defRes.rows || [])
    .map((item: any) => {
      const stored: any = valueMap.get(item.fieldName);
      return {
        id: stored?.id,
        attribute: item.fieldName,
        attributeDesc: item.description,
        fieldType: item.fieldType,
        fieldTypeDesc: item.fieldTypeDesc || item.fieldType,
        required: item.required,
        sequence: item.sequence,
        value: stored?.value
      };
    })
    .sort((a: ExtFieldRow, b: ExtFieldRow) => Number(a.sequence || 0) - Number(b.sequence || 0));
};

const loadGroups = async () => {
  groupsLoading.value = true;
  groupsLoaded.value = false;
  groupsLoadError.value = false;
  try {
    // 组成员通过 NC_CODE.handle 关联，不能使用不合格代码的数字 id。
    if (isEdit.value && !form.handle) throw new Error('不合格代码缺少关联行号');
    const [groupsRes, membersRes] = await Promise.all([listNcGroup(), form.handle ? listNcGroupMember({ ncCodeBo: form.handle }) : Promise.resolve({ rows: [] as NcGroupMemberVO[] })]);
    const members = membersRes.rows || [];
    const options = new Map<string, { key: string; label: string }>();
    (groupsRes.rows || []).forEach((group) => {
      if (!group.handle) return;
      options.set(group.handle, {
        key: group.handle,
        label: [group.ncGroup || group.handle, group.description].filter(Boolean).join(' — ')
      });
    });
    // 主数据已删除或缺失时，仍回显已有成员，避免保存时无意丢失关联。
    members.forEach((member) => {
      if (member.ncGroupBo && !options.has(member.ncGroupBo)) {
        options.set(member.ncGroupBo, { key: member.ncGroupBo, label: `${member.ncGroupBo}（组信息缺失）` });
      }
    });
    groupOptions.value = [...options.values()];
    originalGroupHandles.value = [...new Set(members.map((member) => member.ncGroupBo).filter(Boolean))];
    selectedGroupHandles.value = [...originalGroupHandles.value];
    groupsLoaded.value = true;
  } catch {
    groupsLoadError.value = true;
  } finally {
    groupsLoading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    if (isEdit.value) {
      const res = await getNcCode(route.params.id as string);
      Object.assign(form, res.data);
    }
    await Promise.all([loadExtFields(form.handle), loadGroups()]);
  } finally {
    loading.value = false;
  }
};

const resolveCreatedCode = async () => {
  const res = await listNcCode({ pageNum: 1, pageSize: 10, ncCode: form.ncCode });
  const created = res.rows.find((item) => item.ncCode === form.ncCode);
  if (!created) throw new Error('未获取到新建的不合格代码');
  form.id = created.id;
  form.handle = created.handle;
};

const validateExtFields = () => {
  const missing = extFields.value.find((item) => item.required === 'true' && !String(item.value ?? '').trim());
  if (!missing) return true;
  activeTab.value = 'extFields';
  proxy?.$modal.msgWarning(`请填写扩展字段：${missing.attributeDesc || missing.attribute}`);
  return false;
};

const validateMainInfo = () => {
  if (form.status && form.ncCategory && form.ncType && form.ncSeverityThreshold !== undefined && form.ncSeverityThreshold !== null) {
    return true;
  }
  activeTab.value = 'main';
  proxy?.$modal.msgWarning('请完整填写状态、分类、类别和严重程度');
  return false;
};

const saveExtFields = async () => {
  await Promise.all(
    extFields.value.map((item) => {
      const value = String(item.value ?? '').trim();
      if (!value && item.id) return delExtFields(item.id);
      if (!value) return Promise.resolve();
      const payload = { id: item.id, handle: form.handle, attribute: item.attribute, value };
      return item.id ? updateExtFields(payload) : addExtFields(payload);
    })
  );
};

const saveGroups = async () => {
  // 加载失败时不触碰组关系；其余主信息仍可正常保存。
  if (!groupsLoaded.value) return;
  if (!form.handle) throw new Error('未获取到不合格代码关联行号');
  const originalHandles = new Set(originalGroupHandles.value);
  const selectedHandles = new Set(selectedGroupHandles.value);
  const removedHandles = new Set([...originalHandles].filter((handle) => !selectedHandles.has(handle)));
  const addedHandles = [...selectedHandles].filter((handle) => !originalHandles.has(handle));
  if (!removedHandles.size && !addedHandles.length) return;

  // 重新读取当前关系，使部分保存失败后的重试不会重复新增，也不删除其他用户新增的关系。
  const res = await listNcGroupMember({ ncCodeBo: form.handle });
  const currentMembers = res.rows || [];
  const currentHandles = new Set(currentMembers.map((member) => member.ncGroupBo));
  for (const handle of addedHandles) {
    if (!currentHandles.has(handle)) {
      await addNcGroupMember({ ncGroupBo: handle, ncCodeBo: form.handle });
    }
    // 逐次更新已保存基线，后续请求失败后仍可继续调整、重试。
    originalGroupHandles.value = [...new Set([...originalGroupHandles.value, handle])];
  }
  const removedIds = currentMembers.filter((member) => removedHandles.has(member.ncGroupBo)).map((member) => member.id);
  if (removedIds.length) await delNcGroupMember(removedIds);
  originalGroupHandles.value = originalGroupHandles.value.filter((handle) => !removedHandles.has(handle));
};

const handleSave = async () => {
  if (loading.value || groupsLoading.value || saving.value) return;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !validateMainInfo() || !validateExtFields()) return;
  saving.value = true;
  try {
    if (form.id) {
      await updateNcCode(form);
    } else {
      await addNcCode(form);
      await resolveCreatedCode();
    }
    await saveGroups();
    await saveExtFields();
    proxy?.$modal.msgSuccess('保存成功');
    goBack();
  } finally {
    saving.value = false;
  }
};

const goBack = () => {
  if (proxy?.$tab?.closePage) proxy.$tab.closePage();
  else router.back();
};

onMounted(loadData);
</script>

<style scoped lang="scss">
.nc-code-editor {
  min-height: calc(100vh - 84px);
  padding: 12px;
  background: #f3f4f7;
}
.action-bar {
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fff;
}
.info-card {
  margin-bottom: 8px;
  border: 0;
}
.section-title {
  padding-left: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #244a90;
  border-left: 4px solid #315eb5;
}
.maintenance-tabs {
  padding: 0 20px 22px;
  background: #fff;
}
.main-form {
  max-width: 1180px;
  padding: 20px 40px;
}
.relation-panel {
  max-width: 1180px;
  min-height: 340px;
  padding: 10px 0;
}
.group-transfer {
  display: flex;
  align-items: center;
  :deep(.el-transfer-panel) {
    flex: 1;
    min-width: 0;
  }
  :deep(.el-transfer-panel__body) {
    height: 300px;
  }
  :deep(.el-transfer-panel__list.is-filterable) {
    height: 246px;
  }
  :deep(.el-transfer__buttons) {
    flex-shrink: 0;
    padding: 0 16px;
  }
}
@media (max-width: 768px) {
  .group-transfer {
    flex-direction: column;
    gap: 12px;
    :deep(.el-transfer-panel) {
      flex: auto;
      width: 100%;
    }
  }
}
.tab-toolbar {
  margin: 10px 0 8px;
}
.required-mark {
  margin-right: 3px;
  color: #f56c6c;
}
:deep(.el-card__header) {
  padding: 10px 14px;
}
:deep(.el-table th.el-table__cell) {
  background-color: #f1f4fa;
  color: #303133;
}
</style>
