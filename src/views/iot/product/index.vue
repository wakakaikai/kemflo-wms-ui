<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="产品编码" prop="productCode">
              <el-input v-model="queryParams.productCode" placeholder="请输入产品编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="协议类型" prop="protocolType">
              <el-select v-model="queryParams.protocolType" placeholder="协议类型" clearable style="width: 160px">
                <el-option v-for="item in protocolOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="产品状态" clearable style="width: 120px">
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
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['iot:product:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['iot:product:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="productList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="产品编码" prop="productCode" min-width="140" />
        <el-table-column label="产品名称" prop="productName" min-width="160" />
        <el-table-column label="协议类型" align="center" width="130">
          <template #default="scope">
            <dict-tag :options="protocolOptions" :value="scope.row.protocolType" />
          </template>
        </el-table-column>
        <el-table-column label="厂商" prop="manufacturer" min-width="140" />
        <el-table-column label="产品版本" align="center" width="120" prop="productVersion" />
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="230">
          <template #default="scope">
            <el-button v-hasPermi="['iot:product:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:productPoint:list']" link type="primary" icon="Coin" @click="handlePoints(scope.row)">点位</el-button>
            <el-button v-hasPermi="['iot:product:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="产品编码" prop="productCode">
          <el-input v-model="form.productCode" placeholder="请输入产品编码" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="协议类型" prop="protocolType">
          <el-select v-model="form.protocolType" placeholder="请选择协议类型" style="width: 100%">
            <el-option v-for="item in protocolOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商" prop="manufacturer">
          <el-input v-model="form.manufacturer" placeholder="请输入厂商" />
        </el-form-item>
        <el-form-item label="产品版本" prop="productVersion">
          <el-input v-model="form.productVersion" placeholder="请输入产品版本" />
        </el-form-item>
        <el-form-item label="产品状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
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

<script setup name="IotProduct" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listProduct, getProduct, addProduct, updateProduct, delProduct } from '@/api/iot/product';
import { ProductForm, ProductQuery, ProductVO } from '@/api/iot/product/types';
import { useRouter } from 'vue-router';
import { IOT_PROTOCOL_OPTIONS, resolveDictOptions } from '@/views/iot/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { sys_normal_disable, iot_protocol_type } = toRefs<any>(proxy?.useDict('sys_normal_disable', 'iot_protocol_type'));
const protocolOptions = computed(() => resolveDictOptions(iot_protocol_type.value, IOT_PROTOCOL_OPTIONS));

const productList = ref<ProductVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initFormData: ProductForm = {
  productCode: undefined,
  productName: undefined,
  protocolType: undefined,
  manufacturer: undefined,
  productVersion: undefined,
  status: '0',
  description: undefined,
};

const data = reactive<PageData<ProductForm, ProductQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productCode: undefined,
    productName: undefined,
    protocolType: undefined,
    status: undefined,
  },
  rules: {
    productCode: [{ required: true, message: '产品编码不能为空', trigger: 'blur' }],
    productName: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
    protocolType: [{ required: true, message: '协议类型不能为空', trigger: 'change' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listProduct(queryParams.value);
    productList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selection: ProductVO[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  formRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增产品模型';
};

const handleUpdate = async (row: ProductVO) => {
  reset();
  const res = await getProduct(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改产品模型';
};

const handlePoints = (row: ProductVO) => {
  router.push({ path: '/iot/productPoint', query: { productId: row.id, productName: row.productName } });
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.id ? await updateProduct(form.value) : await addProduct(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: ProductVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的产品数据?');
  await delProduct(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(() => {
  getList();
});
</script>
