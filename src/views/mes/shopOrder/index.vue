<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" label-width="auto" :inline="true">
            <el-form-item label="工单" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计划工作中心" prop="plannedWorkCenterBo">
              <el-input v-model="queryParams.plannedWorkCenterBo" placeholder="请输入计划工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计划物料" prop="plannedItemBo">
              <el-input v-model="queryParams.plannedItemBo" placeholder="请输入计划物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计划工艺路线" prop="plannedRouterBo">
              <el-input v-model="queryParams.plannedRouterBo" placeholder="请输入计划工艺路线" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计划开始时间" prop="plannedStartDate">
              <el-date-picker
                clearable
                v-model="queryParams.plannedStartDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择计划开始时间"
              />
            </el-form-item>
            <el-form-item label="计划完成时间" prop="plannedCompDate">
              <el-date-picker
                clearable
                v-model="queryParams.plannedCompDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择计划完成时间"
              />
            </el-form-item>
            <el-form-item label="实际开始时间" prop="actualStartDate">
              <el-date-picker
                clearable
                v-model="queryParams.actualStartDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择实际开始时间"
              />
            </el-form-item>
            <el-form-item label="实际完成时间" prop="actualCompDate">
              <el-date-picker clearable v-model="queryParams.actualCompDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择实际完成时间" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrder:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrder:edit']"
              >修改</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrder:remove']"
              >删除</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrder:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工单" align="center" prop="shopOrder" width="140" fixed />
        <el-table-column label="状态" align="center" prop="statusDesc" />
        <el-table-column label="工单类型" align="center" prop="shopOrderTypeDesc" />
        <el-table-column label="计划工作中心" align="center" prop="plannedWorkCenter" width="180" />
        <el-table-column label="计划物料" align="center" prop="plannedItem" width="180" />
        <el-table-column label="计划BOM" align="center" prop="plannedBom" width="180" />
        <el-table-column label="计划工艺路线" align="center" prop="plannedRouter" width="180" />
        <el-table-column label="实际工艺路线" align="center" prop="router" width="180" />
        <el-table-column label="计划生产数量" align="center" prop="qtyToBuild" />
        <el-table-column label="下达数量" align="center" prop="qtyReleased" />
        <el-table-column label="计划开始时间" align="center" prop="plannedStartDate" width="180" />
        <el-table-column label="计划完成时间" align="center" prop="plannedCompDate" width="180" />
        <el-table-column label="完成数量" align="center" prop="qtyDone" />
        <el-table-column label="实际开始时间" align="center" prop="actualStartDate" width="180" />
        <el-table-column label="实际完成时间" align="center" prop="actualCompDate" width="180" />
        <el-table-column label="客户编号" align="center" prop="customer" />
        <el-table-column label="客户订单号" align="center" prop="customerOrder" />
        <el-table-column label="超产比例" align="center" prop="overDeliveryTolerance" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="更新者" align="center" prop="updater" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrder:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrder:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单档案对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工单" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单" />
        </el-form-item>
        <el-form-item label="工单优先级" prop="priority">
          <el-input v-model="form.priority" placeholder="请输入工单优先级" />
        </el-form-item>
        <el-form-item label="计划工作中心" prop="plannedWorkCenterBo">
          <el-input v-model="form.plannedWorkCenterBo" placeholder="请输入计划工作中心" />
        </el-form-item>
        <el-form-item label="计划物料" prop="plannedItemBo">
          <el-input v-model="form.plannedItemBo" placeholder="请输入计划物料" />
        </el-form-item>
        <el-form-item label="计划BOM" prop="plannedBomBo">
          <el-input v-model="form.plannedBomBo" placeholder="请输入计划BOM" />
        </el-form-item>
        <el-form-item label="计划工艺路线" prop="plannedRouterBo">
          <el-input v-model="form.plannedRouterBo" placeholder="请输入计划工艺路线" />
        </el-form-item>
        <el-form-item label="实际物料" prop="itemBo">
          <el-input v-model="form.itemBo" placeholder="请输入实际物料" />
        </el-form-item>
        <el-form-item label="实际BOM" prop="bomBo">
          <el-input v-model="form.bomBo" placeholder="请输入实际BOM" />
        </el-form-item>
        <el-form-item label="实际工艺路线" prop="routerBo">
          <el-input v-model="form.routerBo" placeholder="请输入实际工艺路线" />
        </el-form-item>
        <el-form-item label="计划生产数量" prop="qtyToBuild">
          <el-input v-model="form.qtyToBuild" placeholder="请输入计划生产数量" />
        </el-form-item>
        <el-form-item label="下达数量" prop="qtyReleased">
          <el-input v-model="form.qtyReleased" placeholder="请输入下达数量" />
        </el-form-item>
        <el-form-item label="计划开始时间" prop="plannedStartDate">
          <el-date-picker
            clearable
            v-model="form.plannedStartDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择计划开始时间"
          />
        </el-form-item>
        <el-form-item label="计划完成时间" prop="plannedCompDate">
          <el-date-picker
            clearable
            v-model="form.plannedCompDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择计划完成时间"
          />
        </el-form-item>
        <el-form-item label="完成数量" prop="qtyDone">
          <el-input v-model="form.qtyDone" placeholder="请输入完成数量" />
        </el-form-item>
        <el-form-item label="报废数量" prop="qtyScrapped">
          <el-input v-model="form.qtyScrapped" placeholder="请输入报废数量" />
        </el-form-item>
        <el-form-item label="实际开始时间" prop="actualStartDate">
          <el-date-picker
            clearable
            v-model="form.actualStartDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择实际开始时间"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="实际完成时间" prop="actualCompDate">
          <el-date-picker clearable v-model="form.actualCompDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择实际完成时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="客户编号" prop="customer">
          <el-input v-model="form.customer" placeholder="请输入客户编号" />
        </el-form-item>
        <el-form-item label="客户订单号" prop="customerOrder">
          <el-input v-model="form.customerOrder" placeholder="请输入客户订单号" />
        </el-form-item>
        <el-form-item label="超产比例" prop="overDeliveryTolerance">
          <el-input v-model="form.overDeliveryTolerance" placeholder="请输入超产比例" />
        </el-form-item>
        <el-form-item label="考虑报废数量" prop="considerScrap">
          <el-input v-model="form.considerScrap" placeholder="请输入考虑报废数量" />
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

<script setup name="ShopOrder" lang="ts">
import { listShopOrder, getShopOrder, delShopOrder, addShopOrder, updateShopOrder } from '@/api/mes/shopOrder';
import { ShopOrderVO, ShopOrderQuery, ShopOrderForm } from '@/api/mes/shopOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderList = ref<ShopOrderVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShopOrderForm = {
  id: undefined,
  handle: undefined,
  shopOrder: undefined,
  status: undefined,
  shopOrderType: undefined,
  priority: undefined,
  plannedWorkCenterBo: undefined,
  plannedItemBo: undefined,
  plannedBomBo: undefined,
  plannedRouterBo: undefined,
  itemBo: undefined,
  bomBo: undefined,
  routerBo: undefined,
  qtyToBuild: undefined,
  qtyReleased: undefined,
  plannedStartDate: undefined,
  plannedCompDate: undefined,
  releasedDate: undefined,
  qtyDone: undefined,
  qtyScrapped: undefined,
  actualStartDate: undefined,
  actualCompDate: undefined,
  customer: undefined,
  customerOrder: undefined,
  overDeliveryTolerance: undefined,
  considerScrap: undefined,
  remark: undefined,
  createUserId: undefined,
  creator: undefined,
  modifyUserId: undefined,
  updater: undefined,
  modifyTime: undefined,
  deleteFlag: undefined,
  auditDataVersion: undefined,
  secBuId: undefined,
  secUserId: undefined,
  secOuId: undefined,
  belongOrgId: undefined,
  tenantOrgId: undefined,
  dataModifyTime: undefined,
  dataModifyUser: undefined
};
const data = reactive<PageData<ShopOrderForm, ShopOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    shopOrder: undefined,
    status: undefined,
    shopOrderType: undefined,
    priority: undefined,
    plannedWorkCenterBo: undefined,
    plannedItemBo: undefined,
    plannedBomBo: undefined,
    plannedRouterBo: undefined,
    itemBo: undefined,
    bomBo: undefined,
    routerBo: undefined,
    qtyToBuild: undefined,
    qtyReleased: undefined,
    plannedStartDate: undefined,
    plannedCompDate: undefined,
    releasedDate: undefined,
    qtyDone: undefined,
    qtyScrapped: undefined,
    actualStartDate: undefined,
    actualCompDate: undefined,
    customer: undefined,
    customerOrder: undefined,
    overDeliveryTolerance: undefined,
    considerScrap: undefined,
    createUserId: undefined,
    creator: undefined,
    modifyUserId: undefined,
    updater: undefined,
    modifyTime: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    handle: [{ required: true, message: '数据行索引不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    shopOrderType: [{ required: true, message: '工单类型不能为空', trigger: 'change' }],
    priority: [{ required: true, message: '工单优先级不能为空', trigger: 'blur' }],
    plannedWorkCenterBo: [{ required: true, message: '计划工作中心不能为空', trigger: 'blur' }],
    plannedItemBo: [{ required: true, message: '计划物料不能为空', trigger: 'blur' }],
    plannedBomBo: [{ required: true, message: '计划BOM不能为空', trigger: 'blur' }],
    plannedRouterBo: [{ required: true, message: '计划工艺路线不能为空', trigger: 'blur' }],
    qtyToBuild: [{ required: true, message: '计划生产数量不能为空', trigger: 'blur' }],
    plannedStartDate: [{ required: true, message: '计划开始时间不能为空', trigger: 'blur' }],
    plannedCompDate: [{ required: true, message: '计划完成时间不能为空', trigger: 'blur' }],
    qtyDone: [{ required: true, message: '完成数量不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单档案列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShopOrder(queryParams.value);
  shopOrderList.value = res.rows;
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
  shopOrderFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShopOrderVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单档案';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrder(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单档案';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrder(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrder(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单档案编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrder(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/shopOrder/export',
    {
      ...queryParams.value
    },
    `shopOrder_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
