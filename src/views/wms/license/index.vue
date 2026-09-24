<template>
  <div class="app-container license-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="许可证编号/客户" clearable @keyup.enter="load" />
        <el-select v-model="query.status" placeholder="状态" clearable><el-option label="有效" value="ACTIVE" /><el-option label="已撤销" value="REVOKED" /></el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button type="success" @click="createVisible = true">分配 License</el-button>
      </div>
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column prop="licenseNo" label="许可证编号" width="190" />
        <el-table-column prop="customerName" label="客户" min-width="150" />
        <el-table-column prop="features" label="授权功能" min-width="180" show-overflow-tooltip />
        <el-table-column prop="policy" label="策略" width="100" />
        <el-table-column prop="maxDevices" label="设备数" width="80" align="center" />
        <el-table-column prop="validUntil" label="到期时间" width="180" />
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'ACTIVE'" link type="success" @click="openActivate(row)">激活设备</el-button>
            <el-button link type="primary" @click="showDevices(row)">设备监控</el-button>
            <el-button v-if="row.status === 'ACTIVE'" link type="danger" @click="revoke(row)">撤销</el-button>
            <el-button v-else-if="row.status === 'REVOKED'" link type="success" @click="restore(row)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" layout="total, prev, pager, next" :total="total" @current-change="load" /></div>
    </el-card>

    <el-dialog v-model="createVisible" title="分配 License" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="客户名称"><el-input v-model="form.customerName" /></el-form-item>
        <el-form-item label="授权功能"><el-input v-model="form.features" placeholder="MES_PASS_SFC，多个用逗号分隔" /></el-form-item>
        <el-form-item label="授权策略"><el-radio-group v-model="form.policy"><el-radio-button value="ONLINE">在线</el-radio-button><el-radio-button value="OFFLINE">离线</el-radio-button><el-radio-button value="HYBRID">混合</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="最大设备数"><el-input-number v-model="form.maxDevices" :min="1" /></el-form-item>
        <el-form-item label="心跳间隔"><el-input-number v-model="form.heartbeatSeconds" :min="10" /><span class="unit">秒</span></el-form-item>
        <el-form-item label="离线有效期"><el-input-number v-model="form.offlineHours" :min="1" /><span class="unit">小时</span></el-form-item>
        <el-form-item label="到期时间"><el-date-picker v-model="form.validUntil" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="create">创建</el-button></template>
    </el-dialog>

    <el-dialog v-model="keyVisible" title="License 创建成功" width="620px" :close-on-click-modal="false">
      <el-alert title="License Key 只显示这一次，请立即安全保存；上位机不需要使用该 Key。" type="warning" show-icon :closable="false" />
      <el-input :model-value="createdKey" readonly class="key-input"><template #append><el-button @click="copyKey">复制</el-button></template></el-input>
    </el-dialog>

    <el-dialog v-model="activateVisible" title="激活上位机设备" width="620px" :close-on-click-modal="false">
      <el-alert title="请录入目标上位机的真实硬件信息，激活后生成的配置需安全交付给该设备。" type="info" show-icon :closable="false" />
      <el-form :model="activateForm" label-width="120px" class="activate-form">
        <el-form-item label="License"><el-input :model-value="activeLicense?.licenseNo" disabled /></el-form-item>
        <el-form-item label="设备名称"><el-input v-model="activateForm.deviceName" placeholder="例如：产线一号上位机" /></el-form-item>
        <el-form-item label="主板 UUID"><el-input v-model="activateForm.hardwareId" placeholder="MachineGuid 或主板 UUID" /></el-form-item>
        <el-form-item label="MAC 地址"><el-input v-model="activateForm.macAddress" placeholder="00-11-22-33-44-55" /></el-form-item>
        <el-form-item label="CPU 序列号"><el-input v-model="activateForm.cpuId" placeholder="可选" /></el-form-item>
        <el-form-item label="系统盘序列号"><el-input v-model="activateForm.diskSerial" placeholder="可选" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="activateVisible = false">取消</el-button><el-button type="primary" :loading="activating" @click="activateDevice">确认激活</el-button></template>
    </el-dialog>

    <el-dialog v-model="activationResultVisible" title="设备激活成功" width="720px" :close-on-click-modal="false">
      <el-alert title="以下运行配置包含租约凭证，请复制到对应上位机保存，关闭后不再展示。" type="warning" show-icon :closable="false" />
      <el-input :model-value="activationConfigText" type="textarea" :rows="13" readonly class="key-input" />
      <template #footer><el-button type="primary" @click="copyActivationConfig">复制配置</el-button><el-button @click="activationResultVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-drawer v-model="devicesVisible" title="设备使用监控" size="70%">
      <el-table :data="devices" border>
        <el-table-column prop="deviceName" label="设备" min-width="130" />
        <el-table-column prop="macAddress" label="MAC" width="140" />
        <el-table-column prop="deviceFingerprint" label="设备指纹" min-width="190" show-overflow-tooltip />
        <el-table-column prop="instanceId" label="运行实例" min-width="150" show-overflow-tooltip />
        <el-table-column prop="lastIp" label="IP" width="130" />
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="180" />
        <el-table-column label="在线" width="80"><template #default="{ row }"><el-tag :type="isOnline(row) ? 'success' : 'info'">{{ isOnline(row) ? '在线' : '离线' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="90"><template #default="{ row }"><el-button link type="danger" @click="unbind(row)">解绑</el-button></template></el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="WmsLicenseManage">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { activateLicenseDevice, createLicense, listLicenseDevices, listLicenses, restoreLicense, revokeLicense, unbindLicenseDevice, type ApiLicense, type LicenseActivationResult, type LicenseDevice } from '@/api/wms/license';
import { HttpStatus } from '@/enums/RespEnum';

const loading = ref(false), saving = ref(false), activating = ref(false), createVisible = ref(false), keyVisible = ref(false), devicesVisible = ref(false), activateVisible = ref(false), activationResultVisible = ref(false);
const rows = ref<ApiLicense[]>([]), devices = ref<LicenseDevice[]>([]), total = ref(0), createdKey = ref('');
const activeLicenseId = ref<string | number>();
const activeLicense = ref<ApiLicense>();
const activationResult = ref<LicenseActivationResult>();
const query = reactive({ keyword: '', status: '', pageNum: 1, pageSize: 10 });
const form = reactive({ customerName: '', features: 'MES_PASS_SFC', policy: 'HYBRID', maxDevices: 1, heartbeatSeconds: 60, offlineHours: 24, validUntil: '' });
const activateForm = reactive({ deviceName: '', hardwareId: '', macAddress: '', cpuId: '', diskSerial: '' });
const activationConfigText = computed(() => JSON.stringify(activationResult.value || {}, null, 2));

async function load() { loading.value = true; try { const r = await listLicenses(query); rows.value = r.rows || []; total.value = r.total || 0; } finally { loading.value = false; } }
async function create() {
  if (!form.customerName || !form.features || !form.validUntil) return ElMessage.warning('请填写完整信息');
  saving.value = true;
  try { const r = await createLicense(form); if (r.code !== HttpStatus.SUCCESS || !r.data) return; createdKey.value = r.data.licenseKey; createVisible.value = false; keyVisible.value = true; await load(); } finally { saving.value = false; }
}
function openActivate(row: ApiLicense) {
  activeLicense.value = row;
  Object.assign(activateForm, { deviceName: '', hardwareId: '', macAddress: '', cpuId: '', diskSerial: '' });
  activateVisible.value = true;
}
async function activateDevice() {
  if (!activeLicense.value || !activateForm.hardwareId || !activateForm.macAddress) return ElMessage.warning('请填写主板 UUID 和 MAC 地址');
  activating.value = true;
  try {
    const r = await activateLicenseDevice(activeLicense.value.id, activateForm);
    if (r.code !== HttpStatus.SUCCESS || !r.data) return;
    activationResult.value = r.data;
    activateVisible.value = false;
    activationResultVisible.value = true;
  } finally { activating.value = false; }
}
async function showDevices(row: ApiLicense) { activeLicenseId.value = row.id; const r = await listLicenseDevices(row.id); devices.value = r.data || []; devicesVisible.value = true; }
async function revoke(row: ApiLicense) { await ElMessageBox.confirm(`确认撤销 ${row.licenseNo}？`, '提示', { type: 'warning' }); await revokeLicense(row.id); ElMessage.success('已撤销'); await load(); }
async function restore(row: ApiLicense) { await ElMessageBox.confirm(`确认恢复 ${row.licenseNo}？恢复后需由管理员重新激活设备。`, '提示', { type: 'warning' }); await restoreLicense(row.id); ElMessage.success('已恢复，请在管理端重新激活设备'); await load(); }
async function unbind(row: LicenseDevice) { await ElMessageBox.confirm('解绑后需由管理员重新激活该设备，是否继续？', '提示', { type: 'warning' }); await unbindLicenseDevice(row.id); if (activeLicenseId.value) await showDevices({ id: activeLicenseId.value } as ApiLicense); }
function isOnline(row: LicenseDevice) { return row.status === 'ACTIVE' && !!row.leaseExpireTime && new Date(row.leaseExpireTime).getTime() > Date.now(); }
async function copyKey() { await navigator.clipboard.writeText(createdKey.value); ElMessage.success('已复制'); }
async function copyActivationConfig() { await navigator.clipboard.writeText(activationConfigText.value); ElMessage.success('运行配置已复制'); }
onMounted(load);
</script>

<style scoped>
.toolbar{display:flex;gap:10px;margin-bottom:16px}.toolbar .el-input{width:280px}.toolbar .el-select{width:140px}.pagination{display:flex;justify-content:flex-end;margin-top:16px}.unit{margin-left:8px;color:var(--el-text-color-secondary)}.key-input{margin-top:18px}.activate-form{margin-top:18px}.license-page{min-height:calc(100vh - 84px)}
</style>
