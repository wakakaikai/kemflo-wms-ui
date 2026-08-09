import { MSG } from './messages';

export const activityLogColumns = [
  { label: MSG.dateTime, prop: 'dateTime', width: 160 },
  { label: MSG.actionCode, prop: 'actionCode', width: 120 },
  { label: MSG.actionDetail, prop: 'actionDetail', width: 160 },
  { label: MSG.itemRevision, prop: 'itemRevision', minWidth: 140 },
  { label: MSG.operation, prop: 'operation', width: 120 },
  { label: MSG.operationDesc, prop: 'operationDesc', width: 140 },
  { label: MSG.resrce, prop: 'resrce', width: 120 },
  { label: MSG.workCenter, prop: 'workCenter', width: 120 },
  { label: MSG.shopOrderCol, prop: 'shopOrderBo', width: 140 },
  { label: MSG.userId, prop: 'userId', width: 100 }
];

export const componentColumns = [
  { label: MSG.componentBo, prop: 'componentBo', width: 140 },
  { label: MSG.desc, prop: 'componentDesc', minWidth: 200 },
  { label: MSG.componentBarcode, prop: 'inventoryBo', width: 160 },
  { label: MSG.assembledQty, prop: 'qty', width: 100 },
  { label: MSG.assemblyOperation, prop: 'operationBo', width: 100 },
  { label: MSG.bindStatus, prop: 'removed', width: 90, slot: 'removed' }
];

export const ncDataColumns = [
  { label: MSG.productBarcode, prop: 'sfc', width: 160 },
  { label: MSG.operation, prop: 'operation', width: 100 },
  { label: MSG.ncDateTime, prop: 'dateTime', width: 160 },
  { label: MSG.ncCode, prop: 'ncCode', width: 120 },
  { label: MSG.ncCodeDesc, prop: 'ncCodeDescription', minWidth: 160 },
  { label: MSG.userId, prop: 'userId', width: 100 },
  { label: MSG.remark, prop: 'remark', minWidth: 160 }
];

export const testDataColumns = [
  { label: MSG.measureStatus, prop: 'measureStatus', width: 90, slot: 'measureStatus' },
  { label: MSG.testDateTime, prop: 'testDateTime', width: 160 },
  { label: MSG.testUserId, prop: 'userId', width: 100 },
  { label: MSG.measureName, prop: 'measureName', width: 120 },
  { label: MSG.measureNameDesc, prop: 'measureNameDesc', width: 140 },
  { label: MSG.highLimit, prop: 'highLimit', width: 100 },
  { label: MSG.lowLimit, prop: 'lowLimit', width: 100 },
  { label: MSG.actual, prop: 'actual', width: 100 }
];

export const bomColumns = [
  { label: MSG.sequence, prop: 'sequence', width: 70 },
  { label: MSG.componentBo, prop: 'componentGbo', width: 140 },
  { label: MSG.desc, prop: 'componentDesc', minWidth: 200 },
  { label: MSG.operation, prop: 'assemblyOperationBo', width: 100 },
  { label: MSG.operationDesc, prop: 'operationDesc', width: 140 },
  { label: MSG.assemblyQty, prop: 'qty', width: 90 }
];
