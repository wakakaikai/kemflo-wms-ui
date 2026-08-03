<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="自动化编码" prop="automationCode">
              <el-input v-model="queryParams.automationCode" placeholder="请输入自动化编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="自动化名称" prop="automationName">
              <el-input v-model="queryParams.automationName" placeholder="请输入自动化名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="触发类型" prop="triggerType">
              <el-select v-model="queryParams.triggerType" placeholder="触发类型" clearable>
                <el-option label="手工触发" value="MANUAL_TRIGGER" />
                <el-option label="定时触发" value="CRON_TRIGGER" />
                <el-option label="Webhook触发" value="WEBHOOK_TRIGGER" />
                <el-option label="数据触发" value="DATA_TRIGGER" />
                <el-option label="消息触发" value="MESSAGE_TRIGGER" />
                <el-option label="设备触发" value="DEVICE_PROPERTY_TRIGGER" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="流程状态" clearable>
                <el-option label="草稿" value="DRAFT" />
                <el-option label="已发布" value="PUBLISHED" />
                <el-option label="已停用" value="DISABLED" />
                <el-option label="已归档" value="ARCHIVED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['automation:definition:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="definitionList" border>
        <el-table-column label="自动化编码" prop="automationCode" min-width="140" />
        <el-table-column label="自动化名称" prop="automationName" min-width="160" />
        <el-table-column label="触发类型" align="center" width="120">
          <template #default="scope">
            <dict-tag :options="auto_trigger_type" :value="scope.row.triggerType" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="auto_definition_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="当前版本" align="center" width="90" prop="currentVersion" />
        <el-table-column label="是否启用" align="center" width="90">
          <template #default="scope">
            <el-switch
              v-model="scope.row.enabled"
              :active-value="1"
              :inactive-value="0"
              @change="handleEnabledChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column fixed="right" align="center" label="操作" width="300">
          <template #default="scope">
            <el-button v-hasPermi="['automation:definition:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['automation:definition:design']" link type="primary" icon="Brush" @click="handleDesign(scope.row)">设计</el-button>
            <el-button v-hasPermi="['automation:definition:version']" link type="primary" icon="Timer" @click="handleVersions(scope.row)">版本</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleMoreAction(cmd, scope.row)">
              <el-button link type="primary" icon="MoreFilled" style="padding: 0 4px" />
              <template #dropdown>
                <el-dropdown-item v-if="scope.row.status === 'DRAFT'" command="publish" icon="Upload">发布</el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'PUBLISHED'" command="disable" icon="VideoPause">停用</el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'DISABLED'" command="enable" icon="VideoPlay">启用</el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status !== 'ARCHIVED'" command="archive" icon="FolderDelete" divided>归档</el-dropdown-item>
                <el-dropdown-item command="delete" icon="Delete" divided>删除</el-dropdown-item>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 新增/修改对话框 -->
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
            <el-option label="手工触发" value="MANUAL_TRIGGER" />
            <el-option label="定时触发" value="CRON_TRIGGER" />
            <el-option label="Webhook触发" value="WEBHOOK_TRIGGER" />
            <el-option label="数据触发" value="DATA_TRIGGER" />
            <el-option label="消息触发" value="MESSAGE_TRIGGER" />
            <el-option label="设备触发" value="DEVICE_PROPERTY_TRIGGER" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
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
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import {
  listDefinition, getDefinition, addDefinition, updateDefinition, delDefinition,
  publishDefinition, disableDefinition, archiveDefinition
} from '@/api/automation/definition';
import { AutoDefinitionForm, AutoDefinitionQuery, AutoDefinitionVo } from '@/api/automation/definition/types';
import { useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { auto_definition_status, auto_trigger_type } = toRefs<any>(proxy?.useDict('auto_definition_status', 'auto_trigger_type'));

const definitionList = ref<AutoDefinitionVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initFormData: AutoDefinitionForm = {
  automationCode: undefined,
  automationName: undefined,
  triggerType: undefined,
  description: undefined,
  remark: undefined,
};

const data = reactive<PageData<AutoDefinitionForm, AutoDefinitionQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
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

/** 查询流程定义列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listDefinition(queryParams.value);
    definitionList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

/** 取消 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 重置表单 */
const reset = () => {
  form.value = { ...initFormData };
  formRef.value?.resetFields();
};

/** 搜索 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 新增 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增流程定义';
};

/** 修改 */
const handleUpdate = async (row: AutoDefinitionVo) => {
  reset();
  const res = await getDefinition(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改流程定义';
};

/** 设计器 */
const handleDesign = (row: AutoDefinitionVo) => {
  router.push({ path: '/automation/designer/index/' + row.id });
};

/** 版本列表 */
const handleVersions = (row: AutoDefinitionVo) => {
  router.push({ path: '/automation/version', query: { definitionId: row.id, automationName: row.automationName } });
};

/** 提交 */
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

/** 删除 */
const handleDelete = async (row: AutoDefinitionVo) => {
  await proxy?.$modal.confirm('是否确认删除自动化流程"' + row.automationName + '"的数据项?');
  await delDefinition(row.id);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 更多操作 */
const handleMoreAction = async (cmd: string, row: AutoDefinitionVo) => {
  switch (cmd) {
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
      await publishDefinition(row.id);
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

/** 启用/停用切换 */
const handleEnabledChange = async (row: AutoDefinitionVo) => {
  await updateDefinition({ id: row.id, enabled: row.enabled } as AutoDefinitionForm);
  proxy?.$modal.msgSuccess(row.enabled ? '已启用' : '已停用');
};

onMounted(() => {
  getList();
});
</script>