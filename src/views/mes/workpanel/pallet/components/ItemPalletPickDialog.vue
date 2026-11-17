<template>
  <div>
    <el-dialog v-model="visible" title="选择产品" width="70%" append-to-body :close-on-click-modal="false" @closed="onClosed">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" @submit.prevent>
        <el-form-item label="物料编码" prop="item">
          <el-input v-model="queryParams.item" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableList" stripe border height="350" highlight-current-row empty-text="暂无栈板产品配置" @row-dblclick="handleRowDblClick" @row-click="handleRowClick">
        <el-table-column width="52" align="center">
          <template #default="{ row }">
            <el-radio v-model="selectedItem" :label="row.item" class="radio-no-label ml-1">
              <span></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="item" label="物料编码" min-width="140" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="palletNum" label="每板数量" width="100" align="center" />
        <!--        <el-table-column prop="sku" label="SKU" min-width="120" show-overflow-tooltip />-->
        <!--        <el-table-column prop="productId" label="产品 ID" min-width="120" show-overflow-tooltip />-->
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" :disabled="!selectedItem" @click="submitSelect">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { HttpStatus } from '@/enums/RespEnum';
import useDialog from '@/hooks/useDialog';
import { pageWorkPanelItemPallet } from '@/api/mes/workpanel/pallet';
import type { WorkPanelItemPalletQuery, WorkPanelItemPalletVO } from '@/api/mes/workpanel/pallet/types';

const emit = defineEmits<{
  confirm: [row: WorkPanelItemPalletVO];
}>();

const { visible, openDialog: showDialog, closeDialog } = useDialog({ title: '选择产品' });

const queryFormRef = ref<ElFormInstance>();
const loading = ref(false);
const total = ref(0);
const tableList = ref<WorkPanelItemPalletVO[]>([]);
const selectedItem = ref('');
const selectedRow = ref<WorkPanelItemPalletVO | null>(null);

const queryParams = reactive<WorkPanelItemPalletQuery & { item?: string }>({
  pageNum: 1,
  pageSize: 10,
  type: 2,
  item: ''
});

const isApiSuccess = (res: any) => res?.code === HttpStatus.SUCCESS || res?.success === true;

const buildListQuery = (): WorkPanelItemPalletQuery => {
  const trimmed = queryParams.item?.trim();
  return {
    pageNum: queryParams.pageNum,
    pageSize: queryParams.pageSize,
    type: queryParams.type,
    item: trimmed || undefined
  };
};

const getList = async () => {
  loading.value = true;
  try {
    const res: any = await pageWorkPanelItemPallet(buildListQuery());
    if (!isApiSuccess(res)) {
      tableList.value = [];
      total.value = 0;
      return;
    }
    tableList.value = (res.rows || []) as WorkPanelItemPalletVO[];
    total.value = res.total ?? 0;
    syncSelectedRowFromTable();
  } finally {
    loading.value = false;
  }
};

const syncSelectedRowFromTable = () => {
  if (!selectedItem.value) {
    selectedRow.value = null;
    return;
  }
  const hit = tableList.value.find((o) => o.item === selectedItem.value);
  if (hit) {
    selectedRow.value = hit;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  selectedItem.value = '';
  selectedRow.value = null;
  queryParams.pageNum = 1;
  queryParams.item = '';
  getList();
};

const handleRowClick = (row: WorkPanelItemPalletVO) => {
  selectedItem.value = row.item;
  selectedRow.value = row;
};

const handleRowDblClick = (row: WorkPanelItemPalletVO) => {
  selectedItem.value = row.item;
  selectedRow.value = row;
  submitSelect();
};

const submitSelect = () => {
  if (!selectedRow.value || selectedRow.value.item !== selectedItem.value) {
    const row = tableList.value.find((o) => o.item === selectedItem.value);
    if (!row) {
      return;
    }
    selectedRow.value = row;
  }
  emit('confirm', selectedRow.value);
  closeDialog();
};

const onClosed = () => {
  queryParams.item = '';
  queryParams.pageNum = 1;
  selectedItem.value = '';
  selectedRow.value = null;
};

const openDialog = (currentItem?: string) => {
  // 已选料号仅用于表格单选回显，不作为打开弹窗时的查询条件
  selectedItem.value = currentItem || '';
  selectedRow.value = null;
  queryParams.item = '';
  queryParams.pageNum = 1;
  showDialog();
  getList();
};

defineExpose({ openDialog, closeDialog });
</script>

<style scoped>
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
</style>
