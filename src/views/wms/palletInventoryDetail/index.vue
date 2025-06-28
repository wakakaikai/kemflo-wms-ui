<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="打包编号" prop="packingCode">
              <el-input v-model="queryParams.packingCode" placeholder="请输入打包编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="待入库数量" prop="waitStockQty">
              <el-input v-model="queryParams.waitStockQty" placeholder="请输入待入库数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable >
                <el-option v-for="dict in wms_pallet_inventory_status" :key="dict.value" :label="dict.label" :value="dict.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="物料凭证号" prop="materialOrderNo">
              <el-input v-model="queryParams.materialOrderNo" placeholder="请输入物料凭证号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料文件项次" prop="materialItem">
              <el-input v-model="queryParams.materialItem" placeholder="请输入物料文件项次" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker clearable
                v-model="queryParams.productDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择生产日期"
              />
            </el-form-item>
            <el-form-item label="失效日期" prop="expireDate">
              <el-date-picker clearable
                v-model="queryParams.expireDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择失效日期"
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:palletInventoryDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:palletInventoryDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:palletInventoryDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:palletInventoryDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletInventoryDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="打包编号" align="center" prop="packingCode" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="料号" align="center" prop="item" />
        <el-table-column label="待入库数量" align="center" prop="waitStockQty" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_pallet_inventory_status" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column label="物料凭证号" align="center" prop="materialOrderNo" />
        <el-table-column label="物料文件项次" align="center" prop="materialItem" />
        <el-table-column label="生产日期" align="center" prop="productDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="失效日期" align="center" prop="expireDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.expireDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:palletInventoryDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:palletInventoryDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改栈板物料库存明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="palletInventoryDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="打包编号" prop="packingCode">
          <el-input v-model="form.packingCode" placeholder="请输入打包编号" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="料号" prop="item">
          <el-input v-model="form.item" placeholder="请输入料号" />
        </el-form-item>
        <el-form-item label="待入库数量" prop="waitStockQty">
          <el-input v-model="form.waitStockQty" placeholder="请输入待入库数量" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option
                v-for="dict in wms_pallet_inventory_status"
                :key="dict.value"
                :label="dict.label"
                :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="物料凭证号" prop="materialOrderNo">
          <el-input v-model="form.materialOrderNo" placeholder="请输入物料凭证号" />
        </el-form-item>
        <el-form-item label="物料文件项次" prop="materialItem">
          <el-input v-model="form.materialItem" placeholder="请输入物料文件项次" />
        </el-form-item>
        <el-form-item label="生产日期" prop="productDate">
          <el-date-picker clearable
            v-model="form.productDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择生产日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="失效日期" prop="expireDate">
          <el-date-picker clearable
            v-model="form.expireDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择失效日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="PalletInventoryDetail" lang="ts">
import { listPalletInventoryDetail, getPalletInventoryDetail, delPalletInventoryDetail, addPalletInventoryDetail, updatePalletInventoryDetail } from '@/api/wms/palletInventoryDetail';
import { PalletInventoryDetailVO, PalletInventoryDetailQuery, PalletInventoryDetailForm } from '@/api/wms/palletInventoryDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_pallet_inventory_status } = toRefs<any>(proxy?.useDict('wms_pallet_inventory_status'));

const palletInventoryDetailList = ref<PalletInventoryDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const palletInventoryDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PalletInventoryDetailForm = {
  id: undefined,
  palletCode: undefined,
  packingCode: undefined,
  workOrderNo: undefined,
  item: undefined,
  waitStockQty: undefined,
  status: undefined,
  materialOrderNo: undefined,
  materialItem: undefined,
  productDate: undefined,
  expireDate: undefined,
  remark: undefined
}
const data = reactive<PageData<PalletInventoryDetailForm, PalletInventoryDetailQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletCode: undefined,
    packingCode: undefined,
    workOrderNo: undefined,
    item: undefined,
    waitStockQty: undefined,
    status: undefined,
    materialOrderNo: undefined,
    materialItem: undefined,
    productDate: undefined,
    expireDate: undefined,
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
    packingCode: [
      { required: true, message: "打包编号不能为空", trigger: "blur" }
    ],
    workOrderNo: [
      { required: true, message: "工单号不能为空", trigger: "blur" }
    ],
    item: [
      { required: true, message: "料号不能为空", trigger: "blur" }
    ],
    waitStockQty: [
      { required: true, message: "待入库数量不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
    materialOrderNo: [
      { required: true, message: "物料凭证号不能为空", trigger: "blur" }
    ],
    materialItem: [
      { required: true, message: "物料文件项次不能为空", trigger: "blur" }
    ],
    productDate: [
      { required: true, message: "生产日期不能为空", trigger: "blur" }
    ],
    expireDate: [
      { required: true, message: "失效日期不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询栈板物料库存明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPalletInventoryDetail(queryParams.value);
  palletInventoryDetailList.value = res.rows;
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
  palletInventoryDetailFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PalletInventoryDetailVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加栈板物料库存明细";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletInventoryDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getPalletInventoryDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改栈板物料库存明细";
}

/** 提交按钮 */
const submitForm = () => {
  palletInventoryDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePalletInventoryDetail(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addPalletInventoryDetail(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: PalletInventoryDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除栈板物料库存明细编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delPalletInventoryDetail(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/palletInventoryDetail/export', {
    ...queryParams.value
  }, `palletInventoryDetail_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
