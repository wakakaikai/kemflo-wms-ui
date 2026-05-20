<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="班次" prop="productionShift">
              <el-input v-model="queryParams.productionShift" placeholder="请输入班次" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="作业人数" prop="personNumber">
              <el-input v-model="queryParams.personNumber" placeholder="请输入作业人数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="机台数" prop="machineNumber">
              <el-input v-model="queryParams.machineNumber" placeholder="请输入机台数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="模取数" prop="moduleNumber">
              <el-input v-model="queryParams.moduleNumber" placeholder="请输入模取数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="开工时间" prop="startDateTime">
              <el-date-picker clearable v-model="queryParams.startDateTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择开工时间" />
            </el-form-item>
            <el-form-item label="完工时间" prop="endDateTime">
              <el-date-picker clearable v-model="queryParams.endDateTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择完工时间" />
            </el-form-item>
            <el-form-item label="良品数" prop="qtyReport">
              <el-input v-model="queryParams.qtyReport" placeholder="请输入良品数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="报废数" prop="qtyScrapped">
              <el-input v-model="queryParams.qtyScrapped" placeholder="请输入报废数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="SAP工单号" prop="erpShopOrder">
              <el-input v-model="queryParams.erpShopOrder" placeholder="请输入SAP工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="SAP工序" prop="erpOperation">
              <el-input v-model="queryParams.erpOperation" placeholder="请输入SAP工序" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="起迄时长" prop="totalDuration">
              <el-input v-model="queryParams.totalDuration" placeholder="请输入起迄时长" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="休息时长" prop="restDuration">
              <el-input v-model="queryParams.restDuration" placeholder="请输入休息时长" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作时长" prop="operationDuration">
              <el-input v-model="queryParams.operationDuration" placeholder="请输入操作时长" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="停止时间" prop="stopDuration">
              <el-input v-model="queryParams.stopDuration" placeholder="请输入停止时间" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="负荷时间" prop="loadDuration">
              <el-input v-model="queryParams.loadDuration" placeholder="请输入负荷时间" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="例外时间" prop="abnormalDuration">
              <el-input v-model="queryParams.abnormalDuration" placeholder="请输入例外时间" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="有效时长" prop="effectiveDuration">
              <el-input v-model="queryParams.effectiveDuration" placeholder="请输入有效时长" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="实际人时" prop="personTime">
              <el-input v-model="queryParams.personTime" placeholder="请输入实际人时" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="报工结果" prop="reportResult">
              <el-input v-model="queryParams.reportResult" placeholder="请输入报工结果" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="报工结果描述" prop="reportMessage">
              <el-input v-model="queryParams.reportMessage" placeholder="请输入报工结果描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="报工次数" prop="reportCount">
              <el-input v-model="queryParams.reportCount" placeholder="请输入报工次数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="所属组织ID" prop="belongOrgId">
              <el-input v-model="queryParams.belongOrgId" placeholder="请输入所属组织ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="租户组织ID" prop="tenantOrgId">
              <el-input v-model="queryParams.tenantOrgId" placeholder="请输入租户组织ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录创建者ID" prop="createUserId">
              <el-input v-model="queryParams.createUserId" placeholder="请输入记录创建者ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录创建者" prop="creator">
              <el-input v-model="queryParams.creator" placeholder="请输入记录创建者" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录最后更新者ID" prop="modifyUserId">
              <el-input v-model="queryParams.modifyUserId" placeholder="请输入记录最后更新者ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录最后更新者" prop="updater">
              <el-input v-model="queryParams.updater" placeholder="请输入记录最后更新者" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录最后更新时间" prop="modifyTime">
              <el-date-picker clearable v-model="queryParams.modifyTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择记录最后更新时间" />
            </el-form-item>
            <el-form-item label="删除标记" prop="deleteFlag">
              <el-input v-model="queryParams.deleteFlag" placeholder="请输入删除标记" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="锁版本" prop="auditDataVersion">
              <el-input v-model="queryParams.auditDataVersion" placeholder="请输入锁版本" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据归属组织id" prop="secBuId">
              <el-input v-model="queryParams.secBuId" placeholder="请输入数据归属组织id" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据归属雇员id" prop="secUserId">
              <el-input v-model="queryParams.secUserId" placeholder="请输入数据归属雇员id" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据归属公司id" prop="secOuId">
              <el-input v-model="queryParams.secOuId" placeholder="请输入数据归属公司id" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="实际员工出勤时长" prop="employeeTotalDuration">
              <el-input v-model="queryParams.employeeTotalDuration" placeholder="请输入实际员工出勤时长" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="实际人员操作时长" prop="employeeOperationDuration">
              <el-input v-model="queryParams.employeeOperationDuration" placeholder="请输入实际人员操作时长" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrderReport:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrderReport:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrderReport:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderReport:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderReportList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="班次" align="center" prop="productionShift" />
        <el-table-column label="作业人数" align="center" prop="personNumber" />
        <el-table-column label="机台数" align="center" prop="machineNumber" />
        <el-table-column label="模取数" align="center" prop="moduleNumber" />
        <el-table-column label="开工时间" align="center" prop="startDateTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.startDateTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="完工时间" align="center" prop="endDateTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.endDateTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="良品数" align="center" prop="qtyReport" />
        <el-table-column label="报废数" align="center" prop="qtyScrapped" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="报工类型：1：组装报工，2：预装报工，3：注塑报工" align="center" prop="businessType" />
        <el-table-column label="SAP工单号" align="center" prop="erpShopOrder" />
        <el-table-column label="SAP工序" align="center" prop="erpOperation" />
        <el-table-column label="起迄时长" align="center" prop="totalDuration" />
        <el-table-column label="休息时长" align="center" prop="restDuration" />
        <el-table-column label="操作时长" align="center" prop="operationDuration" />
        <el-table-column label="停止时间" align="center" prop="stopDuration" />
        <el-table-column label="负荷时间" align="center" prop="loadDuration" />
        <el-table-column label="例外时间" align="center" prop="abnormalDuration" />
        <el-table-column label="有效时长" align="center" prop="effectiveDuration" />
        <el-table-column label="实际人时" align="center" prop="personTime" />
        <el-table-column label="报工结果" align="center" prop="reportResult" />
        <el-table-column label="报工结果描述" align="center" prop="reportMessage" />
        <el-table-column label="报工次数" align="center" prop="reportCount" />
        <el-table-column label="所属组织ID" align="center" prop="belongOrgId" />
        <el-table-column label="租户组织ID" align="center" prop="tenantOrgId" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="记录创建者ID" align="center" prop="createUserId" />
        <el-table-column label="记录创建者" align="center" prop="creator" />
        <el-table-column label="记录最后更新者ID" align="center" prop="modifyUserId" />
        <el-table-column label="记录最后更新者" align="center" prop="updater" />
        <el-table-column label="记录最后更新时间" align="center" prop="modifyTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.modifyTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="删除标记" align="center" prop="deleteFlag" />
        <el-table-column label="锁版本" align="center" prop="auditDataVersion" />
        <el-table-column label="数据归属组织id" align="center" prop="secBuId" />
        <el-table-column label="数据归属雇员id" align="center" prop="secUserId" />
        <el-table-column label="数据归属公司id" align="center" prop="secOuId" />
        <el-table-column label="实际员工出勤时长" align="center" prop="employeeTotalDuration" />
        <el-table-column label="实际人员操作时长" align="center" prop="employeeOperationDuration" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrderReport:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrderReport:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单开工完工-APP对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderReportFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
        </el-form-item>
        <el-form-item label="班次" prop="productionShift">
          <el-input v-model="form.productionShift" placeholder="请输入班次" />
        </el-form-item>
        <el-form-item label="作业人数" prop="personNumber">
          <el-input v-model="form.personNumber" placeholder="请输入作业人数" />
        </el-form-item>
        <el-form-item label="机台数" prop="machineNumber">
          <el-input v-model="form.machineNumber" placeholder="请输入机台数" />
        </el-form-item>
        <el-form-item label="模取数" prop="moduleNumber">
          <el-input v-model="form.moduleNumber" placeholder="请输入模取数" />
        </el-form-item>
        <el-form-item label="开工时间" prop="startDateTime">
          <el-date-picker clearable v-model="form.startDateTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择开工时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="完工时间" prop="endDateTime">
          <el-date-picker clearable v-model="form.endDateTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择完工时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="良品数" prop="qtyReport">
          <el-input v-model="form.qtyReport" placeholder="请输入良品数" />
        </el-form-item>
        <el-form-item label="报废数" prop="qtyScrapped">
          <el-input v-model="form.qtyScrapped" placeholder="请输入报废数" />
        </el-form-item>
        <el-form-item label="SAP工单号" prop="erpShopOrder">
          <el-input v-model="form.erpShopOrder" placeholder="请输入SAP工单号" />
        </el-form-item>
        <el-form-item label="SAP工序" prop="erpOperation">
          <el-input v-model="form.erpOperation" placeholder="请输入SAP工序" />
        </el-form-item>
        <el-form-item label="起迄时长" prop="totalDuration">
          <el-input v-model="form.totalDuration" placeholder="请输入起迄时长" />
        </el-form-item>
        <el-form-item label="休息时长" prop="restDuration">
          <el-input v-model="form.restDuration" placeholder="请输入休息时长" />
        </el-form-item>
        <el-form-item label="操作时长" prop="operationDuration">
          <el-input v-model="form.operationDuration" placeholder="请输入操作时长" />
        </el-form-item>
        <el-form-item label="停止时间" prop="stopDuration">
          <el-input v-model="form.stopDuration" placeholder="请输入停止时间" />
        </el-form-item>
        <el-form-item label="负荷时间" prop="loadDuration">
          <el-input v-model="form.loadDuration" placeholder="请输入负荷时间" />
        </el-form-item>
        <el-form-item label="例外时间" prop="abnormalDuration">
          <el-input v-model="form.abnormalDuration" placeholder="请输入例外时间" />
        </el-form-item>
        <el-form-item label="有效时长" prop="effectiveDuration">
          <el-input v-model="form.effectiveDuration" placeholder="请输入有效时长" />
        </el-form-item>
        <el-form-item label="实际人时" prop="personTime">
          <el-input v-model="form.personTime" placeholder="请输入实际人时" />
        </el-form-item>
        <el-form-item label="报工结果" prop="reportResult">
          <el-input v-model="form.reportResult" placeholder="请输入报工结果" />
        </el-form-item>
        <el-form-item label="报工结果描述" prop="reportMessage">
          <el-input v-model="form.reportMessage" placeholder="请输入报工结果描述" />
        </el-form-item>
        <el-form-item label="报工次数" prop="reportCount">
          <el-input v-model="form.reportCount" placeholder="请输入报工次数" />
        </el-form-item>
        <el-form-item label="所属组织ID" prop="belongOrgId">
          <el-input v-model="form.belongOrgId" placeholder="请输入所属组织ID" />
        </el-form-item>
        <el-form-item label="租户组织ID" prop="tenantOrgId">
          <el-input v-model="form.tenantOrgId" placeholder="请输入租户组织ID" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="记录创建者ID" prop="createUserId">
          <el-input v-model="form.createUserId" placeholder="请输入记录创建者ID" />
        </el-form-item>
        <el-form-item label="记录创建者" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入记录创建者" />
        </el-form-item>
        <el-form-item label="记录最后更新者ID" prop="modifyUserId">
          <el-input v-model="form.modifyUserId" placeholder="请输入记录最后更新者ID" />
        </el-form-item>
        <el-form-item label="记录最后更新者" prop="updater">
          <el-input v-model="form.updater" placeholder="请输入记录最后更新者" />
        </el-form-item>
        <el-form-item label="记录最后更新时间" prop="modifyTime">
          <el-date-picker clearable v-model="form.modifyTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择记录最后更新时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="删除标记" prop="deleteFlag">
          <el-input v-model="form.deleteFlag" placeholder="请输入删除标记" />
        </el-form-item>
        <el-form-item label="锁版本" prop="auditDataVersion">
          <el-input v-model="form.auditDataVersion" placeholder="请输入锁版本" />
        </el-form-item>
        <el-form-item label="数据归属组织id" prop="secBuId">
          <el-input v-model="form.secBuId" placeholder="请输入数据归属组织id" />
        </el-form-item>
        <el-form-item label="数据归属雇员id" prop="secUserId">
          <el-input v-model="form.secUserId" placeholder="请输入数据归属雇员id" />
        </el-form-item>
        <el-form-item label="数据归属公司id" prop="secOuId">
          <el-input v-model="form.secOuId" placeholder="请输入数据归属公司id" />
        </el-form-item>
        <el-form-item label="实际员工出勤时长" prop="employeeTotalDuration">
          <el-input v-model="form.employeeTotalDuration" placeholder="请输入实际员工出勤时长" />
        </el-form-item>
        <el-form-item label="实际人员操作时长" prop="employeeOperationDuration">
          <el-input v-model="form.employeeOperationDuration" placeholder="请输入实际人员操作时长" />
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

<script setup name="ShopOrderReport" lang="ts">
import { listShopOrderReport, getShopOrderReport, delShopOrderReport, addShopOrderReport, updateShopOrderReport } from '@/api/mes/shopOrderReport';
import { ShopOrderReportVO, ShopOrderReportQuery, ShopOrderReportForm } from '@/api/mes/shopOrderReport/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderReportList = ref<ShopOrderReportVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderReportFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShopOrderReportForm = {
  id: undefined,
  shopOrder: undefined,
  workCenter: undefined,
  productionShift: undefined,
  personNumber: undefined,
  machineNumber: undefined,
  moduleNumber: undefined,
  startDateTime: undefined,
  endDateTime: undefined,
  qtyReport: undefined,
  qtyScrapped: undefined,
  status: undefined,
  businessType: undefined,
  erpShopOrder: undefined,
  erpOperation: undefined,
  totalDuration: undefined,
  restDuration: undefined,
  operationDuration: undefined,
  stopDuration: undefined,
  loadDuration: undefined,
  abnormalDuration: undefined,
  effectiveDuration: undefined,
  personTime: undefined,
  reportResult: undefined,
  reportMessage: undefined,
  reportCount: undefined,
  belongOrgId: undefined,
  tenantOrgId: undefined,
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
  employeeTotalDuration: undefined,
  employeeOperationDuration: undefined
};
const data = reactive<PageData<ShopOrderReportForm, ShopOrderReportQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    shopOrder: undefined,
    workCenter: undefined,
    productionShift: undefined,
    personNumber: undefined,
    machineNumber: undefined,
    moduleNumber: undefined,
    startDateTime: undefined,
    endDateTime: undefined,
    qtyReport: undefined,
    qtyScrapped: undefined,
    status: undefined,
    businessType: undefined,
    erpShopOrder: undefined,
    erpOperation: undefined,
    totalDuration: undefined,
    restDuration: undefined,
    operationDuration: undefined,
    stopDuration: undefined,
    loadDuration: undefined,
    abnormalDuration: undefined,
    effectiveDuration: undefined,
    personTime: undefined,
    reportResult: undefined,
    reportMessage: undefined,
    reportCount: undefined,
    belongOrgId: undefined,
    tenantOrgId: undefined,
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
    employeeTotalDuration: undefined,
    employeeOperationDuration: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    workCenter: [{ required: true, message: '工作中心不能为空', trigger: 'blur' }],
    productionShift: [{ required: true, message: '班次不能为空', trigger: 'blur' }],
    personNumber: [{ required: true, message: '作业人数不能为空', trigger: 'blur' }],
    machineNumber: [{ required: true, message: '机台数不能为空', trigger: 'blur' }],
    moduleNumber: [{ required: true, message: '模取数不能为空', trigger: 'blur' }],
    startDateTime: [{ required: true, message: '开工时间不能为空', trigger: 'blur' }],
    endDateTime: [{ required: true, message: '完工时间不能为空', trigger: 'blur' }],
    qtyReport: [{ required: true, message: '良品数不能为空', trigger: 'blur' }],
    qtyScrapped: [{ required: true, message: '报废数不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    businessType: [{ required: true, message: '报工类型不能为空', trigger: 'change' }],
    erpShopOrder: [{ required: true, message: 'SAP工单号不能为空', trigger: 'blur' }],
    erpOperation: [{ required: true, message: 'SAP工序不能为空', trigger: 'blur' }],
    totalDuration: [{ required: true, message: '起迄时长不能为空', trigger: 'blur' }],
    restDuration: [{ required: true, message: '休息时长不能为空', trigger: 'blur' }],
    operationDuration: [{ required: true, message: '操作时长不能为空', trigger: 'blur' }],
    stopDuration: [{ required: true, message: '停止时间不能为空', trigger: 'blur' }],
    loadDuration: [{ required: true, message: '负荷时间不能为空', trigger: 'blur' }],
    abnormalDuration: [{ required: true, message: '例外时间不能为空', trigger: 'blur' }],
    effectiveDuration: [{ required: true, message: '有效时长不能为空', trigger: 'blur' }],
    personTime: [{ required: true, message: '实际人时不能为空', trigger: 'blur' }],
    reportResult: [{ required: true, message: '报工结果不能为空', trigger: 'blur' }],
    reportMessage: [{ required: true, message: '报工结果描述不能为空', trigger: 'blur' }],
    reportCount: [{ required: true, message: '报工次数不能为空', trigger: 'blur' }],
    belongOrgId: [{ required: true, message: '所属组织ID不能为空', trigger: 'blur' }],
    tenantOrgId: [{ required: true, message: '租户组织ID不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }],
    createUserId: [{ required: true, message: '记录创建者ID不能为空', trigger: 'blur' }],
    creator: [{ required: true, message: '记录创建者不能为空', trigger: 'blur' }],
    modifyUserId: [{ required: true, message: '记录最后更新者ID不能为空', trigger: 'blur' }],
    updater: [{ required: true, message: '记录最后更新者不能为空', trigger: 'blur' }],
    modifyTime: [{ required: true, message: '记录最后更新时间不能为空', trigger: 'blur' }],
    deleteFlag: [{ required: true, message: '删除标记不能为空', trigger: 'blur' }],
    auditDataVersion: [{ required: true, message: '锁版本不能为空', trigger: 'blur' }],
    secBuId: [{ required: true, message: '数据归属组织id不能为空', trigger: 'blur' }],
    secUserId: [{ required: true, message: '数据归属雇员id不能为空', trigger: 'blur' }],
    secOuId: [{ required: true, message: '数据归属公司id不能为空', trigger: 'blur' }],
    employeeTotalDuration: [{ required: true, message: '实际员工出勤时长不能为空', trigger: 'blur' }],
    employeeOperationDuration: [{ required: true, message: '实际人员操作时长不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单开工完工-APP列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShopOrderReport(queryParams.value);
  shopOrderReportList.value = res.rows;
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
  shopOrderReportFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShopOrderReportVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单开工完工-APP';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderReportVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrderReport(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单开工完工-APP';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderReportFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrderReport(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrderReport(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderReportVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单开工完工-APP编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrderReport(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderReport/export',
    {
      ...queryParams.value
    },
    `shopOrderReport_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
