<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="条码" prop="sn">
              <el-input v-model="queryParams.sn" placeholder="请输入条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数量" prop="quantity">
              <el-input v-model="queryParams.quantity" placeholder="请输入数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="单位" prop="unit">
              <el-input v-model="queryParams.unit" placeholder="请输入单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker clearable
                v-model="queryParams.productDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择生产日期"
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:palletInventorySn:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:palletInventorySn:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:palletInventorySn:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:palletInventorySn:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletInventorySnList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="工单号" align="center" prop="orderNo" />
        <el-table-column label="条码" align="center" prop="sn" />
        <el-table-column label="数量" align="center" prop="quantity" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="生产日期" align="center" prop="productDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:palletInventorySn:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:palletInventorySn:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改栈板SN库存明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="palletInventorySnFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="工单号" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="条码" prop="sn">
          <el-input v-model="form.sn" placeholder="请输入条码" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input v-model="form.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="生产日期" prop="productDate">
          <el-date-picker clearable
            v-model="form.productDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择生产日期">
          </el-date-picker>
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

<script setup name="PalletInventorySn" lang="ts">
import { listPalletInventorySn, getPalletInventorySn, delPalletInventorySn, addPalletInventorySn, updatePalletInventorySn } from '@/api/wms/palletInventorySn';
import { PalletInventorySnVO, PalletInventorySnQuery, PalletInventorySnForm } from '@/api/wms/palletInventorySn/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const palletInventorySnList = ref<PalletInventorySnVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const palletInventorySnFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PalletInventorySnForm = {
  id: undefined,
  palletCode: undefined,
  orderNo: undefined,
  sn: undefined,
  quantity: undefined,
  unit: undefined,
  productDate: undefined,
  remark: undefined
}
const data = reactive<PageData<PalletInventorySnForm, PalletInventorySnQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletCode: undefined,
    orderNo: undefined,
    sn: undefined,
    quantity: undefined,
    unit: undefined,
    productDate: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    palletCode: [
      { required: true, message: "栈板编号不能为空", trigger: "blur" }
    ],
    orderNo: [
      { required: true, message: "工单号不能为空", trigger: "blur" }
    ],
    sn: [
      { required: true, message: "条码不能为空", trigger: "blur" }
    ],
    quantity: [
      { required: true, message: "数量不能为空", trigger: "blur" }
    ],
    unit: [
      { required: true, message: "单位不能为空", trigger: "blur" }
    ],
    productDate: [
      { required: true, message: "生产日期不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询栈板SN库存明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPalletInventorySn(queryParams.value);
  palletInventorySnList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  palletInventorySnFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: PalletInventorySnVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加栈板SN库存明细";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletInventorySnVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getPalletInventorySn(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改栈板SN库存明细";
}

/** 提交按钮 */
const submitForm = () => {
  palletInventorySnFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePalletInventorySn(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addPalletInventorySn(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: PalletInventorySnVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除栈板SN库存明细编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delPalletInventorySn(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/palletInventorySn/export', {
    ...queryParams.value
  }, `palletInventorySn_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
