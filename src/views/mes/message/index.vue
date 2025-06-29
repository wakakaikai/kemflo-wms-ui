<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工位" prop="workStation">
              <el-input v-model="queryParams.workStation" placeholder="请输入工位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="消息标题" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入消息标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="优先级0-9，数字越大优先级越高" prop="priority">
              <el-input v-model="queryParams.priority" placeholder="请输入优先级0-9，数字越大优先级越高" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="消息发送时间" prop="sendTime">
              <el-date-picker clearable v-model="queryParams.sendTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择消息发送时间" />
            </el-form-item>
            <el-form-item label="消息发送人" prop="sendUser">
              <el-input v-model="queryParams.sendUser" placeholder="请输入消息发送人" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="消息确认时间" prop="confirmTime">
              <el-date-picker clearable v-model="queryParams.confirmTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择消息确认时间" />
            </el-form-item>
            <el-form-item label="消息确认人" prop="confirmUser">
              <el-input v-model="queryParams.confirmUser" placeholder="请输入消息确认人" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:message:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:message:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:message:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:message:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="messageList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="消息唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="工位" align="center" prop="workStation" />
        <el-table-column label="消息标题" align="center" prop="title" />
        <el-table-column label="消息内容" align="center" prop="content" />
        <el-table-column label="消息类型：1-异常呼叫通知,2-警报,3-私信,4-任务,5-系统" align="center" prop="messageType" />
        <el-table-column label="优先级0-9，数字越大优先级越高" align="center" prop="priority" />
        <el-table-column label="消息状态：0-草稿,1-活跃,2-已失效" align="center" prop="status" />
        <el-table-column label="消息发送时间" align="center" prop="sendTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.sendTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消息发送人" align="center" prop="sendUser" />
        <el-table-column label="消息确认时间" align="center" prop="confirmTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.confirmTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消息确认人" align="center" prop="confirmUser" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:message:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:message:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改消息主表对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="messageFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
        </el-form-item>
        <el-form-item label="工位" prop="workStation">
          <el-input v-model="form.workStation" placeholder="请输入工位" />
        </el-form-item>
        <el-form-item label="消息标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入消息标题" />
        </el-form-item>
        <el-form-item label="消息内容">
          <editor v-model="form.content" :min-height="192" />
        </el-form-item>
        <el-form-item label="优先级0-9，数字越大优先级越高" prop="priority">
          <el-input v-model="form.priority" placeholder="请输入优先级0-9，数字越大优先级越高" />
        </el-form-item>
        <el-form-item label="消息发送时间" prop="sendTime">
          <el-date-picker clearable v-model="form.sendTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择消息发送时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="消息发送人" prop="sendUser">
          <el-input v-model="form.sendUser" placeholder="请输入消息发送人" />
        </el-form-item>
        <el-form-item label="消息确认时间" prop="confirmTime">
          <el-date-picker clearable v-model="form.confirmTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择消息确认时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="消息确认人" prop="confirmUser">
          <el-input v-model="form.confirmUser" placeholder="请输入消息确认人" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
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

<script setup name="Message" lang="ts">
import { listMessage, getMessage, delMessage, addMessage, updateMessage } from '@/api/mes/message';
import { MessageVO, MessageQuery, MessageForm } from '@/api/mes/message/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const messageList = ref<MessageVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const messageFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: MessageForm = {
  id: undefined,
  workCenter: undefined,
  workStation: undefined,
  title: undefined,
  content: undefined,
  messageType: undefined,
  priority: undefined,
  status: undefined,
  sendTime: undefined,
  sendUser: undefined,
  confirmTime: undefined,
  confirmUser: undefined,
  remark: undefined
};
const data = reactive<PageData<MessageForm, MessageQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workCenter: undefined,
    workStation: undefined,
    title: undefined,
    content: undefined,
    messageType: undefined,
    priority: undefined,
    status: undefined,
    sendTime: undefined,
    sendUser: undefined,
    confirmTime: undefined,
    confirmUser: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '消息唯一ID不能为空', trigger: 'blur' }],
    workCenter: [{ required: true, message: '工作中心不能为空', trigger: 'blur' }],
    workStation: [{ required: true, message: '工位不能为空', trigger: 'blur' }],
    title: [{ required: true, message: '消息标题不能为空', trigger: 'blur' }],
    content: [{ required: true, message: '消息内容不能为空', trigger: 'blur' }],
    messageType: [{ required: true, message: '消息类型：1-异常呼叫通知,2-警报,3-私信,4-任务,5-系统不能为空', trigger: 'change' }],
    priority: [{ required: true, message: '优先级0-9，数字越大优先级越高不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '消息状态：0-草稿,1-活跃,2-已失效不能为空', trigger: 'change' }],
    sendTime: [{ required: true, message: '消息发送时间不能为空', trigger: 'blur' }],
    sendUser: [{ required: true, message: '消息发送人不能为空', trigger: 'blur' }],
    confirmTime: [{ required: true, message: '消息确认时间不能为空', trigger: 'blur' }],
    confirmUser: [{ required: true, message: '消息确认人不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询消息主表列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMessage(queryParams.value);
  messageList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  messageFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: MessageVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加消息主表';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: MessageVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getMessage(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改消息主表';
};

/** 提交按钮 */
const submitForm = () => {
  messageFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateMessage(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addMessage(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: MessageVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除消息主表编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delMessage(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/message/export',
    {
      ...queryParams.value
    },
    `message_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
