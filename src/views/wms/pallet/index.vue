<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入栈板描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable filterable>
                <el-option v-for="dict in wms_pallet_status" :key="dict.value" :label="dict.label" :value="dict.value" />
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

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>

          <el-button v-hasPermi="['wms:pallet:edit']" color="#722ED1" plain :disabled="multiple" @click="handleEmpty()" class="empty-btn">
            <template #icon>
              <svg-icon icon-class="empty" class="icon-empty" />
            </template>
            清空
          </el-button>

          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:pallet:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="scope">
            <el-table v-loading="loading" :data="scope.row.palletInventoryDetailVoList" style="width: calc(100% - 110px); float: right; margin: 10px 0" empty-text="暂无数据">
              <el-table-column label="序号" align="center" width="60">
                <template #default="{ $index }">
                  {{ $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="打包编号" align="center" prop="packingCode" />
              <el-table-column label="工单号" align="center" prop="workOrderNo" />
              <el-table-column label="料号" align="center" prop="item" />
              <el-table-column label="描述" align="center" prop="itemDesc" />
              <el-table-column label="数量" align="center" prop="packingQty" />
              <el-table-column label="状态" align="center" prop="status">
                <template #default="scope">
                  <dict-tag :options="wms_pallet_inventory_status" :value="scope.row.status" />
                </template>
              </el-table-column>
              <el-table-column label="物料凭证号" align="center" prop="materialOrderNo" />
              <el-table-column label="物料文件项次" align="center" prop="materialItem" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="栈板编号" align="left" prop="palletCode" />
        <el-table-column label="栈板描述" align="left" prop="description" />
        <el-table-column label="状态" align="left" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_pallet_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="项次数" align="left" prop="countPackingDetail">
          <template #default="scope">
            <span>{{ (scope.row.palletInventoryDetailVoList || []).length }}</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="left" prop="warehouseCode" />
        <el-table-column label="仓库描述" align="left" prop="warehouseDesc" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:pallet:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:pallet:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改栈板信息对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="palletFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input ref="palletCodeInputRef" v-model="form.palletCode" placeholder="请输入栈板编号" @keydown.tab.prevent="keyDownTab" @keydown.enter.prevent="keyDownTab" />
        </el-form-item>
        <el-form-item label="栈板描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入栈板描述" />
        </el-form-item>
        <el-form-item label="目的仓库" prop="warehouseCode">
          <el-select v-model="form.warehouseCode" placeholder="请选择目的仓库" clearable filterable>
            <el-option v-for="warehouse in warehouseLocationList" :key="warehouse.code" :label="`${warehouse.code}-${warehouse.name}`" :value="warehouse.code" />
          </el-select>
        </el-form-item>
        <!--        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="dict in wms_pallet_status" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>-->
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Pallet" lang="ts">
import { addPallet, delPallet, emptyPallet, getPallet, pagePalletInventory, updatePallet } from '@/api/wms/pallet';

import { PalletForm, PalletQuery, PalletVO } from '@/api/wms/pallet/types';
import { nextTick, ref } from 'vue';
import { WarehouseLocationVO } from '@/api/wms/warehouseLocation/types';
import { listWarehouseLocation } from '@/api/wms/warehouseLocation';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_pallet_status } = toRefs<any>(proxy?.useDict('wms_pallet_status'));
const { wms_pallet_inventory_status } = toRefs<any>(proxy?.useDict('wms_pallet_inventory_status'));
const palletCodeInputRef = ref<HTMLInputElement | null>(null);
const palletList = ref<PalletVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const palletCodeList = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const palletFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const inventoryDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const initFormData: PalletForm = {
  id: undefined,
  palletCode: undefined,
  description: undefined,
  status: 0,
  warehouseCode: undefined,
  remark: undefined
};
const data = reactive<PageData<PalletForm, PalletQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletCode: undefined,
    description: undefined,
    status: undefined,
    warehouseCode: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
/** 查询仓位信息列表 */
const getWarehouseList = async () => {
  const warehouseQueryParams = {
    parentId: 0
  };
  const res = await listWarehouseLocation(warehouseQueryParams);
  warehouseLocationList.value = res.data;
};

/** 查询栈板信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await pagePalletInventory(queryParams.value);
  palletList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
  getList();
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  palletFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PalletVO[]) => {
  [ids.value, palletCodeList.value] = selection.reduce(
    (acc, { id, palletCode }) => {
      acc[0].push(id);
      acc[1].push(palletCode);
      return acc;
    },
    [[], []]
  );

  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加栈板信息';
  getWarehouseList();
};

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getPallet(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改栈板信息';
  getWarehouseList();
};

const keyDownTab = async () => {
  palletFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePallet(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addPallet(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('添加成功');
      await nextTick(() => {
        if (palletCodeInputRef.value) {
          palletCodeInputRef.value.focus();
          palletCodeInputRef.value.select();
        }
      });
    }
  });
};

/** 提交按钮 */
const submitForm = () => {
  palletFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePallet(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addPallet(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: PalletVO) => {
  const _ids = row?.id || ids.value;
  const palletCodes = row?.palletCode || palletCodeList.value;
  await proxy?.$modal.confirm('确认是否删除栈板编号为"' + palletCodes + '"的数据项？').finally(() => (loading.value = false));
  await delPallet(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 清空按钮操作 */
const handleEmpty = async (row?: PalletVO) => {
  const _ids = row?.id || ids.value;
  const palletCodes = row?.palletCode || palletCodeList.value;
  await proxy?.$modal.confirm('确认是否清空栈板编号为"' + palletCodes + '"的数据项？').finally(() => (loading.value = false));
  await emptyPallet(_ids);
  proxy?.$modal.msgSuccess('清空成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/pallet/export',
    {
      ...queryParams.value
    },
    `pallet_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.icon-path {
  fill: currentColor;
}

/* 悬停、激活、聚焦状态 - 白色 */
.empty-btn:not(.is-disabled):hover,
.empty-btn:not(.is-disabled):active,
.empty-btn:not(.is-disabled):focus {
  color: white !important;
  fill: white !important;
}
</style>
