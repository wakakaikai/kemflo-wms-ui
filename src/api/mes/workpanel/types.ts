import type { ShopOrderReportVO } from '@/api/mes/shopOrderReport/types';
import type { ShopOrderReportEmployeeVO } from '@/api/mes/shopOrderReportEmployee/types';

export interface WorkCenterEmployeeBindingVO {
  id: string | number;
  workCenter: string;
  employeeId: string;
  employeeName: string;
  status: number;
  onLineTime: string;
  offLineTime?: string;
  shopOrder?: string;
  resrce?: string;
  reportId?: string | number;
  remark?: string;
}

export interface WorkPanelDataVO {
  reportList: ShopOrderReportVO[];
  onlineEmployeeList: WorkCenterEmployeeBindingVO[];
  reportEmployeeList: ShopOrderReportEmployeeVO[];
}

export interface WorkPanelRouterStepVO {
  stepId: string;
  sequence: number;
  operationBo: string;
  operation: string;
  operationDesc?: string;
  resourceType?: string;
  resourceTypeBo?: string;
  defaultResource?: string;
  defaultResourceBo?: string;
  isReportingStep?: string;
  startStep?: string;
  endStep?: string;
}

export interface WorkPanelStartForm {
  workCenter: string;
  resrce?: string;
  shopOrder: string;
  productionShift: string;
  startDateTime: string;
  personNumber?: number;
  machineNumber?: number;
  moduleNumber?: number;
  businessType?: number;
  employeeList?: WorkPanelEmployeeForm[];
}

export interface WorkPanelCompleteForm {
  reportId: string | number;
  endDateTime: string;
  qtyReport: number;
  qtyScrapped?: number;
  restDuration?: number;
  stopDuration?: number;
  loadDuration?: number;
  abnormalDuration?: number;
  remark?: string;
  sfcSelections?: WorkPanelSfcSelectionForm[];
}

export interface WorkPanelEmployeeForm {
  reportId?: string | number;
  workCenter?: string;
  resrce?: string;
  shopOrder?: string;
  employeeId: string;
  employeeName?: string;
  dateTime?: string;
  bindingIdList?: Array<string | number>;
}

/** 0未上线 1已在工作中心上线 2已在当前工单上线 3已在其他工单上线 4已在其他工作中心上线 */
export interface WorkPanelEmployeeOnlineStatusVO {
  onlineStatus: number;
  employeeId: string;
  employeeName?: string;
  message?: string;
  onlineBindingList?: WorkCenterEmployeeBindingVO[];
}

export interface WorkPanelProductionShiftBreakVO {
  breakStart?: string;
  breakEnd?: string;
}

export interface WorkPanelProductionShiftVO {
  shiftId: string;
  shiftDesc?: string;
  startTime?: string;
  endTime?: string;
  shiftBreaksList?: WorkPanelProductionShiftBreakVO[];
}

export interface WorkPanelCompletePrepareVO {
  reportId?: string | number;
  shopOrder?: string;
  workCenter?: string;
  operationDesc?: string;
  item?: string;
  productDesc?: string;
  qtyToBuild?: number;
  qtyDone?: number;
  qtyReported?: number;
  productionShift?: string;
  shiftDisplay?: string;
  startDateTime?: string;
  endDateTime?: string;
  businessType?: number;
  qtyReportReadOnly?: boolean;
  qtyReport?: number;
  qtyScrapped?: number;
  standardPersonNumber?: number;
  standardCapacity?: number;
  actualPersonNumber?: number;
  theoryOutput?: number;
  totalDuration?: number;
  restDuration?: number;
  operationDuration?: number;
  stopDuration?: number;
  loadDuration?: number;
  abnormalDuration?: number;
  effectiveDuration?: number;
  personTime?: number;
  goodRate?: number;
  timeRate?: number;
  speedRate?: number;
  oeeRate?: number;
  reportEmployeeList?: import('@/api/mes/shopOrderReportEmployee/types').ShopOrderReportEmployeeVO[];
  pendingBarcodeList?: WorkPanelPendingBarcodeVO[];
  exceptionTimeList?: WorkPanelExceptionTimeVO[];
}

export interface WorkPanelPendingBarcodeVO {
  item?: string;
  startTime?: string;
  endTime?: string;
  qty?: number;
  selectType?: 'required' | 'optional' | 'disabled';
  type?: number;
  checked?: boolean;
  selectable?: boolean;
  idList?: Array<string | number>;
}

export interface WorkPanelSfcSelectionForm {
  type: number;
  checked: boolean;
}

export interface WorkPanelExceptionTimeVO {
  type?: string;
  typeDesc?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface WorkPanelCompletePrepareForm {
  reportId: string | number;
  endDateTime?: string;
  qtyReport?: number;
  qtyScrapped?: number;
  restDuration?: number;
  stopDuration?: number;
  loadDuration?: number;
  abnormalDuration?: number;
  sfcSelections?: WorkPanelSfcSelectionForm[];
}

export interface WorkPanelEmployeeFavoriteVO {
  id: string | number;
  employeeId?: string;
  type?: number;
  content: string;
  description?: string;
  remark?: string;
}

export interface WorkPanelEmployeeFavoriteForm {
  type?: number;
  content: string;
  description?: string;
}
