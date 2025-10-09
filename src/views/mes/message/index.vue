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
            <el-form-item label="确认状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择确认状态" clearable filterable>
                <el-option label="已发送" value="1" />
                <el-option label="已确认" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="发送时间" prop="sendTimeRange">
              <el-date-picker
                v-model="queryParams.sendTimeRange"
                type="datetimerange"
                :shortcuts="shortcuts"
                value-format="YYYY-MM-DD HH:mm:ss"
                range-separator="-"
                start-placeholder="请选择开始日期"
                end-placeholder="请选择结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:message:add']">新增 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:message:edit']">修改 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:message:remove']">删除 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:message:export']"> 导出 </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="messageList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column prop="workStation" align="left" label="工作岗位">
          <template #default="{ row }">
            <span v-if="row.workStation || row.workStationDesc"> {{ row.workStation }}（{{ row.workStationDesc }}） </span>
          </template>
        </el-table-column>
        <el-table-column label="消息标题" align="center" prop="title" />
        <el-table-column label="消息内容" align="center" prop="content" />
        <el-table-column prop="priority" label="优先级" sortable :sort-method="prioritySort">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority as MessagePriority)">
              {{ getPriorityName(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认状态" align="center" prop="messageStatus" sortable :sort-method="statusSort">
          <template #default="{ row }">
            <dict-tag :options="mes_message_status" :value="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="呼叫发送人" align="center" prop="sendUserName" />
        <el-table-column label="呼叫时间" align="center" prop="sendTime" sortable />
        <el-table-column label="响应确认人" align="center" prop="confirmUserName" />
        <el-table-column label="响应时间" align="center" prop="confirmTime" sortable />
        <el-table-column label="响应时长（分）" align="center" prop="confirmDurationTime" sortable :sort-method="durationSort" />
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
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="70%" append-to-body>
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
        <el-form-item label="优先级" prop="priority">
          <el-input v-model="form.priority" placeholder="请输入优先级0-9，数字越大优先级越高" />
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
import { parseTime } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_message_status } = toRefs<any>(proxy?.useDict('mes_message_status'));
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
    messageType: [
      {
        required: true,
        message: '消息类型：1-异常呼叫通知,2-警报,3-私信,4-任务,5-系统不能为空',
        trigger: 'change'
      }
    ],
    priority: [{ required: true, message: '优先级0-9，数字越大优先级越高不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '消息状态：0-草稿,1-活跃,2-已失效不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
// 辅助函数：获取优先级名称和样式
enum MessagePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

const getPriorityName = (priority: MessagePriority) => {
  const names = {
    [MessagePriority.LOW]: '低',
    [MessagePriority.MEDIUM]: '中',
    [MessagePriority.HIGH]: '高',
    [MessagePriority.CRITICAL]: '紧急'
  };
  return names[priority] || '未知';
};

const getPriorityTagType = (priority: MessagePriority) => {
  const types: Record<MessagePriority, string> = {
    [MessagePriority.LOW]: 'info',
    [MessagePriority.MEDIUM]: 'primary', // 中优先级使用蓝色
    [MessagePriority.HIGH]: 'warning',
    [MessagePriority.CRITICAL]: 'danger'
  };
  return types[priority] ?? 'primary'; // 使用空值合并运算符确保非空
};
// 优先级自定义排序
const prioritySort = (a: MessageVO, b: MessageVO) => {
  return a.priority - b.priority; // 数字越大优先级越高
};
// 确认状态自定义排序 (1=已发送, 2=已确认)
const statusSort = (a: MessageVO, b: MessageVO) => {
  // 确保未定义的状态排在最后
  if (!a.status) return 1;
  if (!b.status) return -1;
  return Number(a.status) - Number(b.status);
};
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];

// 响应时长自定义排序
const durationSort = (a: MessageVO, b: MessageVO) => {
  const durationA = a.confirmDurationTime !== null && a.confirmDurationTime !== undefined ? parseFloat(String(a.confirmDurationTime)) : -1;
  const durationB = b.confirmDurationTime !== null && b.confirmDurationTime !== undefined ? parseFloat(String(b.confirmDurationTime)) : -1;

  // 将空值或无效值排在最后
  if (durationA === -1 && durationB === -1) return 0;
  if (durationA === -1) return 1;
  if (durationB === -1) return -1;

  // 数字从大到小排序（降序）
  return durationB - durationA;
};

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
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate());
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  queryParams.value.sendTimeRange = [parseTime(start), parseTime(end)];
  getList();
});
</script>
