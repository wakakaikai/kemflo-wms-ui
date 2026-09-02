<template>
  <div class="flow-definition-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="search-bar">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="search-form">
          <el-form-item label="流程名称" prop="automationName">
            <el-input
              v-model="queryParams.automationName"
              placeholder="请输入流程名称"
              clearable
              style="width: 220px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="触发类型" prop="triggerType">
            <el-select v-model="queryParams.triggerType" placeholder="全部" clearable style="width: 140px">
              <el-option v-for="item in triggerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
              <el-option v-for="item in definitionStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <div class="flow-list-panel">
      <div class="panel-toolbar">
        <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
      </div>

      <div v-loading="loading" class="flow-card-grid">
        <button
          v-hasPermi="['automation:definition:add']"
          type="button"
          class="flow-card flow-card--add"
          @click="handleAdd()"
        >
          <span class="add-icon">+</span>
          <span class="add-text">添加流程</span>
        </button>

        <article
          v-for="row in definitionList"
          :key="row.id"
          class="flow-card"
          @click="handleDesign(row)"
        >
          <header class="flow-card__head">
            <span class="flow-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="6" cy="6" r="2.5" />
                <circle cx="18" cy="12" r="2.5" />
                <circle cx="8" cy="18" r="2.5" />
                <path d="M8.4 7.2l7.2 3.6M8.4 16.8l7.2-3.6" />
              </svg>
            </span>
            <div class="flow-card__meta">
              <h3 class="flow-card__title" :title="row.automationName">{{ row.automationName }}</h3>
              <time class="flow-card__time">{{ proxy?.parseTime(row.createTime) }}</time>
            </div>
            <el-tag v-if="row.status === 'PUBLISHED'" size="small" type="success" effect="light" class="flow-card__status">
              已发布
            </el-tag>
            <el-dropdown trigger="click" @command="(cmd: string) => handleMoreAction(cmd, row)" @click.stop>
              <button type="button" class="flow-card__menu" aria-label="更多操作" @click.stop>
                <el-icon><MoreFilled /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-hasPermi="['automation:definition:edit']" command="edit" icon="Edit">编辑</el-dropdown-item>
                  <el-dropdown-item v-hasPermi="['automation:definition:design']" command="design" icon="Brush">设计</el-dropdown-item>
                  <el-dropdown-item v-hasPermi="['automation:definition:version']" command="version" icon="Timer">版本</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'DRAFT'" command="publish" icon="Upload" divided>发布</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'PUBLISHED'" command="disable" icon="VideoPause">停用</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'DISABLED'" command="enable" icon="VideoPlay">启用</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== 'ARCHIVED'" command="archive" icon="FolderDelete" divided>归档</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="Delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </header>

          <p class="flow-card__desc">{{ row.description?.trim() || '暂无描述' }}</p>

          <footer class="flow-card__foot" @click.stop>
            <span class="flow-tag">{{ triggerLabel(row.triggerType) }}</span>
            <span class="flow-tag">v{{ row.currentVersion || 1 }}</span>
            <span class="flow-tag">{{ row.automationCode }}</span>
            <dict-tag :options="definitionStatusOptions" :value="row.status" />
            <el-switch
              v-model="row.enabled"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="启"
              inactive-text="停"
              size="small"
              class="flow-card__switch"
              @change="handleEnabledChange(row)"
            />
          </footer>
        </article>

        <el-empty v-if="!loading && definitionList.length === 0" description="暂无流程，点击左侧添加" class="flow-empty" />
      </div>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </div>

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="自动化编码" prop="automationCode">
          <el-input v-model="form.automationCode" placeholder="请输入自动化编码" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="自动化名称" prop="automationName">
          <el-input v-model="form.automationName" placeholder="请输入自动化名称" />
        </el-form-item>
        <el-form-item label="触发类型" prop="triggerType">
          <el-select v-model="form.triggerType" placeholder="请选择触发类型" style="width: 100%">
            <el-option v-for="item in triggerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AutomationDefinition" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { FormInstance } from 'element-plus';
import { MoreFilled } from '@element-plus/icons-vue';
import {
  listDefinition, getDefinition, addDefinition, updateDefinition, delDefinition,
  publishDefinition, enableDefinition, disableDefinition, archiveDefinition, updateDefinitionEnabled
} from '@/api/automation/definition';
import { AutoDefinitionForm, AutoDefinitionQuery, AutoDefinitionVo } from '@/api/automation/definition/types';
import { useRouter } from 'vue-router';
import {
  AUTO_DEFINITION_STATUS_OPTIONS, AUTO_TRIGGER_TYPE_OPTIONS, resolveDictOptions
} from '@/views/automation/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { auto_definition_status, auto_trigger_type } = toRefs<any>(proxy?.useDict('auto_definition_status', 'auto_trigger_type'));
const definitionStatusOptions = computed(() => resolveDictOptions(auto_definition_status.value, AUTO_DEFINITION_STATUS_OPTIONS));
const triggerTypeOptions = computed(() => resolveDictOptions(auto_trigger_type.value, AUTO_TRIGGER_TYPE_OPTIONS));

const definitionList = ref<AutoDefinitionVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();

const initFormData: AutoDefinitionForm = {
  automationCode: undefined,
  automationName: undefined,
  triggerType: undefined,
  description: undefined,
};

const data = reactive<PageData<AutoDefinitionForm, AutoDefinitionQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 12,
    automationCode: undefined,
    automationName: undefined,
    triggerType: undefined,
    status: undefined,
  },
  rules: {
    automationCode: [{ required: true, message: '自动化编码不能为空', trigger: 'blur' }],
    automationName: [{ required: true, message: '自动化名称不能为空', trigger: 'blur' }],
    triggerType: [{ required: true, message: '触发类型不能为空', trigger: 'change' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

function triggerLabel(value?: string) {
  return triggerTypeOptions.value.find((item) => item.value === value)?.label || value || '手工触发';
}

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDefinition(queryParams.value);
    definitionList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  formRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增流程定义';
};

const handleUpdate = async (row: AutoDefinitionVo) => {
  reset();
  const res = await getDefinition(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改流程定义';
};

const handleDesign = (row: AutoDefinitionVo) => {
  router.push({ path: `/automation/designer/index/${row.id}` });
};

const handleVersions = (row: AutoDefinitionVo) => {
  router.push({ path: '/automation/version', query: { definitionId: row.id, automationName: row.automationName } });
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (form.value.id) {
        await updateDefinition(form.value);
      } else {
        await addDefinition(form.value);
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row: AutoDefinitionVo) => {
  await proxy?.$modal.confirm('是否确认删除自动化流程"' + row.automationName + '"的数据项?');
  await delDefinition(row.id);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleMoreAction = async (cmd: string, row: AutoDefinitionVo) => {
  switch (cmd) {
    case 'edit':
      await handleUpdate(row);
      return;
    case 'design':
      handleDesign(row);
      return;
    case 'version':
      handleVersions(row);
      return;
    case 'publish':
      await proxy?.$modal.confirm('确认发布流程"' + row.automationName + '"?');
      await publishDefinition(row.id);
      proxy?.$modal.msgSuccess('发布成功');
      break;
    case 'disable':
      await disableDefinition(row.id);
      proxy?.$modal.msgSuccess('已停用');
      break;
    case 'enable':
      await enableDefinition(row.id);
      proxy?.$modal.msgSuccess('已启用');
      break;
    case 'archive':
      await proxy?.$modal.confirm('确认归档流程"' + row.automationName + '"?');
      await archiveDefinition(row.id);
      proxy?.$modal.msgSuccess('已归档');
      break;
    case 'delete':
      await handleDelete(row);
      return;
  }
  await getList();
};

const handleEnabledChange = async (row: AutoDefinitionVo) => {
  try {
    await updateDefinitionEnabled(row.id, row.enabled ?? 0);
    proxy?.$modal.msgSuccess(row.enabled ? '已启用' : '已停用');
  } catch {
    row.enabled = row.enabled === 1 ? 0 : 1;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.flow-definition-page {
  padding: 12px 16px 16px;
  min-height: calc(100vh - 84px);
  background: #f5f6f8;
}

.search-bar {
  margin-bottom: 12px;
  padding: 14px 16px 4px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.flow-list-panel {
  padding: 12px 16px 8px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.flow-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  min-height: 200px;
  align-items: start;
}

.flow-card {
  display: flex;
  flex-direction: column;
  min-height: 168px;
  padding: 14px 14px 12px;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
  text-align: left;
}

.flow-card:hover {
  border-color: #c9d4e3;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.flow-card--add {
  align-items: center;
  justify-content: center;
  min-height: 168px;
  border-style: dashed;
  border-color: #d9dee5;
  background: #fafbfc;
  color: #8c8c8c;
  box-shadow: none;
}

.flow-card--add:hover {
  border-color: #1677ff;
  color: #1677ff;
  background: #f7fbff;
  transform: none;
}

.add-icon {
  font-size: 28px;
  line-height: 1;
  font-weight: 300;
}

.add-text {
  margin-top: 8px;
  font-size: 14px;
}

.flow-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.flow-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #eef4ff;
  color: #1677ff;
  flex: 0 0 auto;
}

.flow-card__meta {
  flex: 1;
  min-width: 0;
}

.flow-card__title {
  margin: 0;
  color: #141414;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-card__time {
  display: block;
  margin-top: 4px;
  color: #bfbfbf;
  font-size: 12px;
  line-height: 1.2;
}

.flow-card__status {
  flex: 0 0 auto;
  margin-top: 2px;
}

.flow-card__menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: -4px -4px 0 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
}

.flow-card__menu:hover {
  background: #f5f5f5;
  color: #262626;
}

.flow-card__desc {
  flex: 1;
  margin: 12px 0 10px;
  color: #8c8c8c;
  font-size: 13px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.flow-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.flow-tag {
  display: inline-block;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-card__switch {
  margin-left: auto;
}

.flow-empty {
  grid-column: 1 / -1;
  padding: 48px 0;
}

.flow-list-panel :deep(.pagination-container) {
  margin-top: 16px;
  padding: 0 !important;
}

@media (min-width: 1600px) {
  .flow-card-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .flow-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
