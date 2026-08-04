<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item v-if="!routeProductId" label="产品" prop="productId">
              <el-select v-model="queryParams.productId" placeholder="请选择产品" clearable filterable style="width: 200px" @change="handleQuery">
                <el-option v-for="item in productOptions" :key="item.id" :label="item.productName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="点位编码" prop="pointCode">
              <el-input v-model="queryParams.pointCode" placeholder="请输入点位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="点位名称" prop="pointName">
              <el-input v-model="queryParams.pointName" placeholder="请输入点位名称" clearable @keyup.enter="handleQuery" />
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
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">产品点位管理</span>
            <span v-if="headerProductName" class="ml-2 text-gray-400">- {{ headerProductName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button v-hasPermi="['iot:productPoint:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
            <el-button icon="Back" @click="goBack">返回</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="pointList" border>
        <el-table-column label="点位编码" prop="pointCode" min-width="140" />
        <el-table-column label="点位名称" prop="pointName" min-width="160" />
        <el-table-column label="数据类型" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="dataTypeOptions" :value="scope.row.dataType" />
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" width="80" prop="unit" />
        <el-table-column label="读写类型" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="readWriteOptions" :value="scope.row.readWrite" />
          </template>
        </el-table-column>
        <el-table-column label="最小值" align="center" width="90" prop="minValue" />
        <el-table-column label="最大值" align="center" width="90" prop="maxValue" />
        <el-table-column label="排序" align="center" width="70" prop="sortOrder" />
        <el-table-column fixed="right" align="center" label="操作" width="160">
          <template #default="scope">
            <el-button v-hasPermi="['iot:productPoint:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:productPoint:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="550px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="!routeProductId" label="产品" prop="productId">
          <el-select v-model="form.productId" placeholder="请选择产品" filterable style="width: 100%">
            <el-option v-for="item in productOptions" :key="item.id" :label="item.productName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="点位编码" prop="pointCode">
          <el-input v-model="form.pointCode" placeholder="请输入点位编码" />
        </el-form-item>
        <el-form-item label="点位名称" prop="pointName">
          <el-input v-model="form.pointName" placeholder="请输入点位名称" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="form.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option v-for="item in dataTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="读写类型" prop="readWrite">
          <el-select v-model="form.readWrite" placeholder="请选择读写类型" style="width: 100%">
            <el-option v-for="item in readWriteOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最小值" prop="minValue">
          <el-input-number v-model="form.minValue" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大值" prop="maxValue">
          <el-input-number v-model="form.maxValue" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
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

<script setup name="IotProductPoint" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listProductPoint, getProductPoint, addProductPoint, updateProductPoint, delProductPoint } from '@/api/iot/productPoint';
import { ProductPointForm, ProductPointQuery, ProductPointVO } from '@/api/iot/productPoint/types';
import { listProduct } from '@/api/iot/product';
import { ProductVO } from '@/api/iot/product/types';
import { useRoute, useRouter } from 'vue-router';
import { IOT_DATA_TYPE_OPTIONS, IOT_READ_WRITE_OPTIONS } from '@/views/iot/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const dataTypeOptions = IOT_DATA_TYPE_OPTIONS;
const readWriteOptions = IOT_READ_WRITE_OPTIONS;

const routeProductId = computed(() => route.query.productId as string | undefined);
const headerProductName = computed(() => (route.query.productName as string) || selectedProductName.value);

const pointList = ref<ProductPointVO[]>([]);
const productOptions = ref<ProductVO[]>([]);
const selectedProductName = ref('');
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initFormData: ProductPointForm = {
  productId: undefined,
  pointCode: undefined,
  pointName: undefined,
  dataType: undefined,
  unit: undefined,
  readWrite: 'R',
  minValue: 0,
  maxValue: 100,
  sortOrder: 0,
};

const data = reactive<PageData<ProductPointForm, ProductPointQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productId: route.query.productId as string || undefined,
    pointCode: undefined,
    pointName: undefined,
  },
  rules: {
    productId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
    pointCode: [{ required: true, message: '点位编码不能为空', trigger: 'blur' }],
    pointName: [{ required: true, message: '点位名称不能为空', trigger: 'blur' }],
    dataType: [{ required: true, message: '数据类型不能为空', trigger: 'change' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const loadProductOptions = async () => {
  const res = await listProduct({ pageNum: 1, pageSize: 100 });
  productOptions.value = (res as any).rows ?? [];
  if (queryParams.value.productId && !route.query.productName) {
    const found = productOptions.value.find((p) => String(p.id) === String(queryParams.value.productId));
    selectedProductName.value = found?.productName || '';
  }
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listProductPoint(queryParams.value);
    pointList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const goBack = () => router.push({ path: '/iot/product' });

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = {
    ...initFormData,
    productId: routeProductId.value || queryParams.value.productId,
  };
  formRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  if (queryParams.value.productId && !routeProductId.value) {
    const found = productOptions.value.find((p) => String(p.id) === String(queryParams.value.productId));
    selectedProductName.value = found?.productName || '';
  }
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  if (routeProductId.value) {
    queryParams.value.productId = routeProductId.value;
  }
  handleQuery();
};

const handleAdd = () => {
  reset();
  form.value.productId = routeProductId.value || queryParams.value.productId;
  dialog.visible = true;
  dialog.title = '新增点位';
};

const handleUpdate = async (row: ProductPointVO) => {
  reset();
  const res = await getProductPoint(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改点位';
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (!form.value.productId) {
        form.value.productId = routeProductId.value || queryParams.value.productId;
      }
      form.value.id ? await updateProductPoint(form.value) : await addProductPoint(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row: ProductPointVO) => {
  await proxy?.$modal.confirm('是否确认删除点位"' + row.pointName + '"?');
  await delProductPoint(row.id);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(async () => {
  if (!routeProductId.value) {
    await loadProductOptions();
  }
  await getList();
});
</script>
