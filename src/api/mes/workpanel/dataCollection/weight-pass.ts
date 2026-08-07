/**
 * 称重站数据收集过站入参组装（对齐 /mes/dataCollection/passSfc 的 DataCollectionBo）
 */

export interface WeightPassContext {
  sfc?: string;
  shopOrder?: string;
  operation?: string;
  resource?: string;
  itemBo?: string;
  itemGroupBo?: string;
  qty?: number | string;
}

/** 优先取数字类型参数（dataType = N），否则 WGT* 参数或首项 */
export function findWeightDcParameter(list: any[] = []) {
  return (
    list.find((item) => item?.dataType === 'N') ||
    list.find((item) => String(item?.dcParameter || '').toUpperCase().includes('WGT')) ||
    list[0]
  );
}

/** 重量保留指定小数位（默认 3 位） */
export function formatWeightValue(val: string | number | undefined | null, digits = 3): string {
  if (val === undefined || val === null || val === '') {
    return '';
  }
  const num = parseFloat(String(val));
  if (isNaN(num)) {
    return String(val);
  }
  return num.toFixed(digits);
}

/**
 * 转成后端 DcParameterBo（字段见 org.dromara.wms.domain.mes.bo.DcParameterBo 定义）
 * 参考 weight-no-sn：handle / dcGroupBo / dcParameter / actualValue / units 为过站关键字段
 */
export function toDcParameterBoList(list: any[] = []) {
  return list
    .filter((item) => item?.handle && item?.dcGroupBo && item?.actualValue != null && String(item.actualValue).trim() !== '')
    .map((item) => {
      const actualValue = String(item.actualValue).trim();
      return {
        handle: item.handle,
        dcGroupBo: item.dcGroupBo,
        sequence: item.sequence,
        dcParameter: item.dcParameter,
        description: item.description,
        dataType: item.dataType,
        status: item.status,
        booleanTrueValue: item.booleanTrueValue,
        booleanFalseValue: item.booleanFalseValue,
        minValue: item.minValue,
        maxValue: item.maxValue,
        targetValue: item.targetValue,
        actualValue,
        overrideMinMax: item.overrideMinMax,
        autoLogNc: item.autoLogNc,
        ncCodeBo: item.ncCodeBo,
        units: item.units,
        requiredDataEntries: item.requiredDataEntries,
        optionalDataEntries: item.optionalDataEntries,
        remark: item.remark
      };
    });
}

/** 组装条码数据收集过站请求体 DataCollectionBo */
export function buildDataCollectPassPayload(ctx: WeightPassContext, detailList: any[]) {
  const dcParameterBoList = toDcParameterBoList(detailList);
  return {
    sfc: ctx.sfc,
    shopOrder: ctx.shopOrder,
    operation: ctx.operation,
    resource: ctx.resource,
    itemBo: ctx.itemBo,
    itemGroupBo: ctx.itemGroupBo,
    qty: ctx.qty,
    dcParameterBoList
  };
}
