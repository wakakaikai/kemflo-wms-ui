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

/** 数字类型参数，按 sequence 排序 */
export function getNumericDcParameters(list: any[] = []) {
  return list
    .filter((item) => item?.dataType === 'N')
    .sort((a, b) => (Number(a?.sequence) || 0) - (Number(b?.sequence) || 0));
}

/** 仅依据参数自身编号/描述识别残水参数（不含收集组描述，避免同组参数误判） */
export function isResidualDcParameter(item: any) {
  const text = `${item?.dcParameter || ''}${item?.description || ''}`.toUpperCase();
  return text.includes('残水') || text.includes('RESIDUAL');
}

/** 识别称重参数（WGT / 称重 / WEIGHT） */
export function isWeightDcParameter(item: any) {
  const param = String(item?.dcParameter || '').toUpperCase();
  const desc = String(item?.description || '').toUpperCase();
  return param.includes('WGT') || desc.includes('称重') || desc.includes('WEIGHT');
}

/** 识别残水值参数：优先匹配参数名/描述，否则在双数字参数场景取非称重项或第二项 */
export function findResidualDcParameter(list: any[] = []) {
  const numberParams = getNumericDcParameters(list);
  const explicit = numberParams.find(isResidualDcParameter);
  if (explicit) {
    return explicit;
  }

  const weightExplicit = numberParams.find(isWeightDcParameter);
  if (weightExplicit && numberParams.length > 1) {
    return numberParams.find((item) => item !== weightExplicit);
  }

  return numberParams.length > 1 ? numberParams[1] : undefined;
}

/** 优先取称重数字参数（dataType = N 且非残水），否则 WGT* 参数或首项 */
export function findWeightDcParameter(list: any[] = []) {
  const numberParams = getNumericDcParameters(list);
  if (numberParams.length === 0) {
    return (
      list.find((item) => String(item?.dcParameter || '').toUpperCase().includes('WGT')) ||
      list[0]
    );
  }

  const residual = findResidualDcParameter(list);
  return (
    numberParams.find(isWeightDcParameter) ||
    numberParams.find((item) => item !== residual) ||
    numberParams[0]
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
