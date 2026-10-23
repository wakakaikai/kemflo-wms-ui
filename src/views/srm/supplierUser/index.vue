<template>
  <div class="p-2">
    <el-card shadow="never">
      <template #header><el-button v-hasPermi="['srm:supplierUser:edit']" type="primary" icon="Plus" @click="openAdd">绑定供应商账号</el-button></template>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="userId" label="用户ID" width="120" /><el-table-column prop="supplierCode" label="供应商代码" width="140" /><el-table-column prop="supplierName" label="供应商名称" min-width="200" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" /><el-table-column label="操作" width="130"><template #default="{ row }"><el-button link type="primary" @click="edit(row)">编辑</el-button><el-button link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
    </el-card>
    <el-dialog v-model="visible" title="供应商账号绑定" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="系统用户" required><el-select v-model="form.userId" filterable style="width:100%"><el-option v-for="user in users" :key="user.userId" :value="user.userId" :label="`${user.userName} / ${user.nickName}`" /></el-select></el-form-item>
        <el-form-item label="供应商" required><el-select v-model="form.supplierCode" filterable style="width:100%"><el-option v-for="item in suppliers" :key="item.supplierCode" :value="item.supplierCode" :label="`${item.supplierCode} / ${item.supplierName}`" /></el-select></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item><el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="SupplierUser" lang="ts">
import { addSupplierUser, deleteSupplierUser, listSupplierUser, updateSupplierUser } from '@/api/srm/supplierUser';
import { listUser } from '@/api/system/user';
import { listSupplier } from '@/api/wms/supplier';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const rows=ref<any[]>([]), users=ref<any[]>([]), suppliers=ref<any[]>([]), total=ref(0), loading=ref(false), visible=ref(false);
const query=reactive({pageNum:1,pageSize:20}); const form=ref<any>({status:1});
const loadList=async()=>{loading.value=true;try{const r=await listSupplierUser(query);rows.value=r.rows;total.value=r.total}finally{loading.value=false}};
const loadOptions=async()=>{const [u,s]=await Promise.all([listUser({pageNum:1,pageSize:1000}),listSupplier({pageNum:1,pageSize:1000,status:1})]);users.value=u.rows;suppliers.value=s.rows};
const openAdd=()=>{form.value={status:1};visible.value=true}; const edit=(row:any)=>{form.value={...row};visible.value=true};
const save=async()=>{if(!form.value.userId||!form.value.supplierCode)return proxy?.$modal.msgWarning('请选择用户和供应商');form.value.id?await updateSupplierUser(form.value):await addSupplierUser(form.value);proxy?.$modal.msgSuccess('保存成功');visible.value=false;loadList()};
const remove=async(row:any)=>{await proxy?.$modal.confirm('确认删除该供应商账号绑定？');await deleteSupplierUser(row.id);proxy?.$modal.msgSuccess('删除成功');loadList()};
onMounted(()=>{loadList();loadOptions()});
</script>
