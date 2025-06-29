<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="70%" append-to-body @opened="getList" @closed="closeDialogRefresh">
      <el-table v-loading="loading" :data="messageList" @selection-change="handleSelectionChange">
        <el-table-column label="工作中心" align="center" prop="workCenter" width="100" />
        <el-table-column label="工作岗位" align="center" prop="workStationDesc" width="150" />
        <el-table-column label="消息标题" align="center" prop="title" width="100" />
        <el-table-column label="消息内容" align="center" prop="content" />
        <el-table-column label="发送人" align="center" prop="sendUser" width="100" />
        <el-table-column label="消息发送时间" align="center" prop="sendTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-tooltip content="确认" placement="top">
              <el-button v-hasPermi="['mes:message:edit']" link type="primary" icon="Edit" @click="confirmMessage(scope.row)">确认</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="Message" lang="ts">
import { listMessage, getMessage, delMessage, addMessage, updateMessage } from '@/api/mes/message';
import { MessageVO, MessageQuery, MessageForm } from '@/api/mes/message/types';
import useDialog from '@/hooks/useDialog';

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

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '消息确认'
});
const props = defineProps<{
  podConfig: Record<string, any>;
}>();
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
    pageSize: 1000,
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
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

/** 查询消息主表列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.workCenter = props.podConfig.workCenter;
  queryParams.value.workStation = props.podConfig.resourceType;
  queryParams.value.status = 1;
  const res = await listMessage(queryParams.value);
  messageList.value = res.rows;
  loading.value = false;
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: MessageVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const confirmMessage = async (row) => {
  await ElMessageBox.confirm(`确认【${row.content}】异常已经受到处理?`, '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      buttonLoading.value = true;
      if (row.id) {
        row.status = 2;
        await updateMessage(row);
      }
      proxy?.$modal.msgSuccess('操作成功');
      await getList(); // 重新查询列表

      // 如果列表为空则关闭弹框，否则保持打开
      if (messageList.value.length === 0) {
        closeDialog();
      }
    })
    .catch(() => {
      // 取消操作
    })
    .finally(() => {
      buttonLoading.value = false;
    });
};

const closeDialogRefresh = () => {
  messageList.value = [];
  proxy.$emit('abnormalCallCallBack');
};

onMounted(() => {});

defineExpose({
  openDialog,
  closeDialog
});
</script>

<style scoped>
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
</style>
