<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="凭证名称" prop="credentialName">
              <el-input v-model="queryParams.credentialName" placeholder="请输入凭证名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="凭证类型" prop="credentialType">
              <el-select v-model="queryParams.credentialType" placeholder="凭证类型" clearable>
                <el-option v-for="item in credentialTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
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
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:credential:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:credential:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:credential:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="credentialList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="凭证名称" align="center" prop="credentialName" :show-overflow-tooltip="true" />
        <el-table-column label="凭证类型" align="center" prop="credentialType">
          <template #default="scope">
            <el-tag v-if="scope.row.credentialType === 'BASIC'" type="success" effect="plain">BASIC</el-tag>
            <el-tag v-else-if="scope.row.credentialType === 'TOKEN'" type="warning" effect="plain">TOKEN</el-tag>
            <el-tag v-else-if="scope.row.credentialType === 'CERT'" type="primary" effect="plain">CERT</el-tag>
            <el-tag v-else-if="scope.row.credentialType === 'KEYSTORE'" type="danger" effect="plain">KEYSTORE</el-tag>
            <span v-else>{{ scope.row.credentialType }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['integration:credential:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['integration:credential:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改凭证对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
      <el-form ref="credentialFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="凭证名称" prop="credentialName">
          <el-input v-model="form.credentialName" placeholder="请输入凭证名称" />
        </el-form-item>
        <el-form-item label="凭证类型" prop="credentialType">
          <el-select v-model="form.credentialType" placeholder="请选择凭证类型">
            <el-option v-for="item in credentialTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="凭证数据" prop="credentialDataJson">
          <el-input v-model="form.credentialDataJson" type="textarea" :rows="6" placeholder="请输入凭证数据（JSON格式，加密存储）" />
          <div class="el-form-item-msg">数据将加密存储</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Credential" lang="ts">
import { listCredential, getCredential, delCredential, addCredential, updateCredential } from '@/api/integration/credential';
import { CredentialForm, CredentialQuery, CredentialVO } from '@/api/integration/credential/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const credentialTypeOptions = [
  { value: 'BASIC', label: 'BASIC' },
  { value: 'TOKEN', label: 'TOKEN' },
  { value: 'CERT', label: 'CERT' },
  { value: 'KEYSTORE', label: 'KEYSTORE' }
];

const credentialList = ref<CredentialVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const credentialFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CredentialForm = {
  credentialId: undefined,
  credentialName: '',
  credentialType: '',
  credentialDataJson: '',
  status: '0'
};
const data = reactive<PageData<CredentialForm, CredentialQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    credentialName: '',
    credentialType: '',
    status: ''
  },
  rules: {
    credentialName: [{ required: true, message: '凭证名称不能为空', trigger: 'blur' }],
    credentialType: [{ required: true, message: '凭证类型不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询凭证列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listCredential(queryParams.value);
    credentialList.value = res.rows;
    total.value = res.total;
  } finally { loading.value = false; }
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  credentialFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: CredentialVO[]) => {
  ids.value = selection.map((item) => item.credentialId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加凭证';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: CredentialVO) => {
  reset();
  const _credentialId = row?.credentialId || ids.value[0];
  const res = await getCredential(_credentialId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改凭证';
};

/** 提交按钮 */
const submitForm = () => {
  credentialFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.credentialId) {
        await updateCredential(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addCredential(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: CredentialVO) => {
  const _credentialIds = row?.credentialId || ids.value;
  await proxy?.$modal.confirm('是否确认删除凭证编号为"' + _credentialIds + '"的数据项？');
  await delCredential(_credentialIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>
