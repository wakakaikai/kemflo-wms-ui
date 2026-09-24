import { formatQty } from '@/utils/ruoyi';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { InventoryMovementVO } from '@/api/wms/inventoryMovement/types';

const PRIMARY_RECEIPT_MOVE_TYPES = new Set(['101', '103', '105', '107', '109']);
const SUBCONTRACT_CONSUMPTION_MOVE_TYPES = new Set(['543', '544']);

export interface MovementExpandRow {
  groupKey?: string;
  id?: string | number;
  moveType?: string;
  inventoryDirection?: number;
  hasPair?: boolean;
  mainMovement?: InventoryMovementVO;
  /** @deprecated 与 childMovementList 同步，请优先使用 childMovementList */
  childMovements?: InventoryMovementVO[];
  /** 后端 list 返回的子行，树表唯一数据来源 */
  childMovementList?: InventoryMovementVO[];
  allMovementList?: InventoryMovementVO[];
  movements?: InventoryMovementVO[];
  outMovement?: InventoryMovementVO;
  inMovement?: InventoryMovementVO;
}

export interface ReverseTreeRow extends InventoryMovementVO, MovementExpandRow {
  rowKey: string;
  isGroupHead?: boolean;
  children?: ReverseTreeRow[];
}

export const isPrimaryReceiptMoveType = (moveType?: string) => PRIMARY_RECEIPT_MOVE_TYPES.has(String(moveType ?? '').trim());

export const isSubcontractConsumptionMoveType = (moveType?: string) => SUBCONTRACT_CONSUMPTION_MOVE_TYPES.has(String(moveType ?? '').trim());

export const buildSapVoucherItemGroupKey = (row: Pick<InventoryMovementVO, 'sapMaterialDocYear' | 'sapMaterialOrderNo' | 'sapMaterialItem'>) => {
  const voucherKey = `${String(row.sapMaterialDocYear ?? '').trim()}|${String(row.sapMaterialOrderNo ?? '').trim()}`;
  return `${voucherKey}|${String(row.sapMaterialItem ?? '').trim()}`;
};

export const buildPrimaryReceiptGroupKey = (mainId: string | number) => `P|${mainId}`;

const sameSapMaterialVoucher = (left: InventoryMovementVO, right: InventoryMovementVO) =>
  String(left.sapMaterialDocYear ?? '') === String(right.sapMaterialDocYear ?? '') &&
  String(left.sapMaterialOrderNo ?? '').trim() === String(right.sapMaterialOrderNo ?? '').trim();

const sortSubcontractLines = (list: InventoryMovementVO[]) => [...list].sort((left, right) => String(left.sapMaterialItem ?? '').localeCompare(String(right.sapMaterialItem ?? '')));

const movementLineRank = (moveType?: string) => {
  const type = String(moveType ?? '').trim();
  if (PRIMARY_RECEIPT_MOVE_TYPES.has(type) || type === '102') {
    return 0;
  }
  if (SUBCONTRACT_CONSUMPTION_MOVE_TYPES.has(type)) {
    return 1;
  }
  return 2;
};

const sortMovementLines = (list: InventoryMovementVO[]) =>
  [...list].sort((left, right) => {
    const rankDiff = movementLineRank(left.moveType) - movementLineRank(right.moveType);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return String(left.sapMaterialItem ?? '').localeCompare(String(right.sapMaterialItem ?? ''));
  });

const isPrimaryReceiptMainLine = (row: InventoryMovementVO) => isPrimaryReceiptMoveType(row.moveType) && row.inventoryDirection === 1;

const linksToParentMovement = (child: InventoryMovementVO, parentId: string | number) => String(child.parentMoveId ?? '') === String(parentId);

/** 子行仅取自当前行接口返回的 childMovementList（按 parent_move_id 过滤） */
export const filterChildMovementsByParentMoveId = (parentId: string | number | undefined, lines: InventoryMovementVO[]): InventoryMovementVO[] => {
  if (parentId == null || !lines.length) {
    return [];
  }
  return lines.filter((line) => line.id != null && String(line.id) !== String(parentId) && String(line.parentMoveId ?? '') === String(parentId));
};

export const resolveMainMovementId = (row: MovementExpandRow): string | number | undefined => row.mainMovement?.id ?? row.id;

export const resolveChildMovements = (row: MovementExpandRow): InventoryMovementVO[] => {
  const mainId = resolveMainMovementId(row);
  const childLines = filterChildMovementsByParentMoveId(mainId, row.childMovementList ?? []);
  return sortMovementLines(childLines);
};

export const hasMovementExpand = (row: MovementExpandRow) => resolveChildMovements(row).length > 0;

export const getMainRowMoveType = (row: MovementExpandRow): string => String(row.mainMovement?.moveType ?? row.moveType ?? '').trim();

export const getMainRowInventoryDirection = (row: MovementExpandRow): number | undefined => {
  const main = row.mainMovement ?? (row as InventoryMovementVO);
  if (main.inventoryDirection === 1 || main.inventoryDirection === -1) {
    return main.inventoryDirection;
  }
  return row.inventoryDirection;
};

export const resolveMainRow = (row: MovementExpandRow): InventoryMovementVO & Record<string, any> => (row.mainMovement ?? row) as InventoryMovementVO & Record<string, any>;

export const resolveRowQuantity = (row: MovementExpandRow) => {
  const main = resolveMainRow(row);
  return main.quantity ?? main.orderQuantity ?? main.poQuantity;
};

export const resolveRowUnit = (row: MovementExpandRow) => {
  const main = resolveMainRow(row);
  return main.unit ?? main.orderUnit ?? main.poUnit;
};

export const resolveLineQuantity = (row: InventoryMovementVO & Record<string, any>) => row.quantity ?? row.orderQuantity ?? row.poQuantity;

export const resolveLineUnit = (row: InventoryMovementVO & Record<string, any>) => row.unit ?? row.orderUnit ?? row.poUnit;

export const formatQtyWithUnit = (qty?: number | string | null, unit?: string) => {
  const text = formatQty(qty);
  if (!text) {
    return unit || '-';
  }
  return unit ? `${text} ${unit}` : text;
};

export const formatSapMaterialItem = (row: InventoryMovementVO & Record<string, any>) => String(row.sapMaterialItem ?? row.materialItem ?? '').trim() || '-';

const resolveApiChildLines = (row: InventoryMovementVO, parentId: string | number) =>
  (row.childMovementList ?? []).filter((candidate) => candidate.id != null && linksToParentMovement(candidate, parentId));

/** 将分页平铺的移动记录组装为展示组（101 主行 + 接口 childMovementList 中的 543/544 子行）。 */
export function buildMovementDisplayGroups(flatRows: InventoryMovementVO[]): MovementExpandRow[] {
  if (!flatRows.length) {
    return [];
  }
  const consumedChildIds = new Set<string>();
  const groups: MovementExpandRow[] = [];

  for (const row of flatRows) {
    if (!isPrimaryReceiptMainLine(row) || row.id == null) {
      continue;
    }
    const childMovements = sortSubcontractLines(resolveApiChildLines(row, row.id));
    childMovements.forEach((child) => consumedChildIds.add(String(child.id)));
    groups.push({
      ...row,
      groupKey: buildPrimaryReceiptGroupKey(row.id),
      mainMovement: row,
      childMovementList: childMovements,
      childMovements: childMovements,
      movements: [row, ...childMovements],
      hasPair: false,
      outMovement: undefined,
      inMovement: row
    });
  }

  for (const row of flatRows) {
    if (row.id != null && consumedChildIds.has(String(row.id))) {
      continue;
    }
    if (groups.some((group) => String(group.mainMovement?.id ?? group.id) === String(row.id))) {
      continue;
    }
    const apiChildren = row.id != null ? resolveApiChildLines(row, row.id) : [];
    const hasPair = apiChildren.length > 0 && row.inventoryDirection === -1 && apiChildren.some((child) => child.inventoryDirection === 1);
    groups.push({
      ...row,
      groupKey: buildSapVoucherItemGroupKey(row),
      mainMovement: row,
      childMovementList: apiChildren,
      childMovements: apiChildren,
      movements: apiChildren.length ? [row, ...apiChildren] : [row],
      hasPair,
      outMovement: row.inventoryDirection === -1 ? row : undefined,
      inMovement: row.inventoryDirection === 1 ? row : hasPair ? apiChildren.find((c) => c.inventoryDirection === 1) : undefined
    });
  }

  return groups;
}

export function findDisplayGroupForMovement(item: MovementExpandRow, allGroups: MovementExpandRow[]): MovementExpandRow | undefined {
  if (item.groupKey) {
    const matched = allGroups.find((group) => group.groupKey === item.groupKey);
    if (matched) {
      return matched;
    }
  }
  const line = (item.mainMovement ?? item) as InventoryMovementVO;
  const parentId = line.parentMoveId;
  if (parentId != null) {
    const parentGroup = allGroups.find((group) => group.groupKey === buildPrimaryReceiptGroupKey(parentId));
    if (parentGroup) {
      return parentGroup;
    }
  }
  if (line.id != null) {
    return allGroups.find((group) => group.groupKey === buildPrimaryReceiptGroupKey(line.id));
  }
  return item.groupKey ? item : undefined;
}

export function resolveReverseGroupsFromSelection(selected: MovementExpandRow[], allGroups: MovementExpandRow[]): MovementExpandRow[] {
  const resolved: MovementExpandRow[] = [];
  const seen = new Set<string>();
  for (const item of selected) {
    const group = findDisplayGroupForMovement(item, allGroups);
    if (!group?.groupKey || seen.has(group.groupKey)) {
      continue;
    }
    seen.add(group.groupKey);
    resolved.push(group);
  }
  return resolved;
}

/** 当前页未带出 543 时，按 parent_move_id 补查并写入 childMovementList。 */
export async function enrichPrimaryReceiptGroupWithSubcontractChildren(group: MovementExpandRow): Promise<MovementExpandRow> {
  const main = (group.mainMovement ?? group) as InventoryMovementVO;
  if (!isPrimaryReceiptMainLine(main) || main.id == null) {
    return normalizeReverseGroupRow(group);
  }
  const existingChildren = group.childMovementList?.length ? [...group.childMovementList] : [];
  if (existingChildren.length > 0) {
    return normalizeReverseGroupRow({ ...group, childMovementList: existingChildren });
  }

  const res = await listInventoryMovement({
    parentMoveId: main.id,
    sapMaterialDocYear: main.sapMaterialDocYear,
    sapMaterialOrderNo: main.sapMaterialOrderNo,
    pageNum: 1,
    pageSize: 500
  });
  const children = ((res.rows || []) as InventoryMovementVO[]).filter((row) => linksToParentMovement(row, main.id!) && sameSapMaterialVoucher(row, main));
  const sortedChildren = sortSubcontractLines(children);
  return normalizeReverseGroupRow({
    ...group,
    groupKey: group.groupKey ?? buildPrimaryReceiptGroupKey(main.id),
    mainMovement: main,
    childMovementList: sortedChildren,
    movements: [main, ...sortedChildren]
  });
}

export const isTreeParentRow = (row: ReverseTreeRow) => row.isGroupHead === true;

/** 采购退货提交：主行用 102/122，托外扣料子行（543）用 544 */
export const resolvePurchaseReturnSubmitMoveType = (
  line: Pick<InventoryMovementVO, 'moveType' | 'parentMoveId'> & { parent_move_id?: string | number | null },
  parentReturnMoveType: string
): string => {
  const original = String(line.moveType ?? '').trim();
  if (original === '543') {
    return '544';
  }
  const parentMoveId = line.parentMoveId ?? line.parent_move_id;
  if (parentMoveId != null && parentMoveId !== '' && (original === '' || SUBCONTRACT_CONSUMPTION_MOVE_TYPES.has(original))) {
    return '544';
  }
  return parentReturnMoveType;
};

export const buildReverseTreeTableData = (groups: MovementExpandRow[]): ReverseTreeRow[] =>
  groups.map((group) => {
    const main = resolveMainRow(group);
    const mainId = main.id;
    const childLines = resolveChildMovements(group);
    const rowKey = String(mainId ?? group.groupKey ?? main.sapMaterialItem ?? '');
    const children: ReverseTreeRow[] = childLines.map((line) => ({
      ...line,
      rowKey: String(line.id ?? `${rowKey}-${line.sapMaterialItem ?? line.itemCode ?? ''}`),
      isGroupHead: false,
      groupKey: group.groupKey,
      parentMoveId: mainId
    }));
    return {
      ...group,
      ...main,
      rowKey,
      groupKey: group.groupKey,
      isGroupHead: true,
      mainMovement: main,
      childMovementList: childLines,
      childMovements: childLines,
      children: children.length ? children : undefined
    };
  });

const appendSapMaterialItem = (items: Set<string>, movement?: InventoryMovementVO) => {
  const sapMaterialItem = String(movement?.sapMaterialItem ?? '').trim();
  if (sapMaterialItem) {
    items.add(sapMaterialItem);
  }
};

export const resolveRequiredCancelSapItemsForGroup = (row: MovementExpandRow): string[] => {
  const items = new Set<string>();
  appendSapMaterialItem(items, row.mainMovement ?? (row as InventoryMovementVO));
  resolveChildMovements(row).forEach((movement) => appendSapMaterialItem(items, movement));
  return [...items].sort((left, right) => left.localeCompare(right));
};

export const collectCancelSapMaterialItemsFromGroups = (rows: MovementExpandRow[]): string[] => {
  const items = new Set<string>();
  for (const row of rows) {
    resolveRequiredCancelSapItemsForGroup(row).forEach((item) => items.add(item));
  }
  return [...items].sort((left, right) => left.localeCompare(right));
};

const mergeMovementLines = (...lineGroups: (InventoryMovementVO[] | undefined)[]): InventoryMovementVO[] => {
  const byKey = new Map<string, InventoryMovementVO>();
  const put = (line?: InventoryMovementVO) => {
    if (!line) {
      return;
    }
    const key = line.id != null ? String(line.id) : `${line.sapMaterialItem ?? ''}|${line.itemCode ?? ''}|${line.moveType ?? ''}`;
    byKey.set(key, line);
  };
  lineGroups.forEach((group) => group?.forEach(put));
  return [...byKey.values()];
};

export const normalizeReverseGroupRow = <T extends MovementExpandRow>(row: T): T => {
  const mainLine = (row.mainMovement ?? row) as InventoryMovementVO;
  const childLines = row.childMovementList?.length ? [...row.childMovementList] : [];
  const movements = mergeMovementLines([mainLine], childLines);
  return {
    ...row,
    mainMovement: mainLine,
    childMovementList: childLines,
    childMovements: childLines,
    movements
  };
};

export const validateReverseCancelSapItems = (rows: MovementExpandRow[]): string | null => {
  for (const row of rows) {
    const normalized = normalizeReverseGroupRow(row);
    const childLines = normalized.childMovementList ?? [];
    if (childLines.length === 0) {
      continue;
    }
    const mainItem = String((normalized.mainMovement ?? normalized).sapMaterialItem ?? '').trim();
    if (!mainItem) {
      return '冲销主行缺少物料凭证项次';
    }
    const childItems = childLines.map((line) => String(line.sapMaterialItem ?? '').trim());
    if (childItems.some((item) => !item)) {
      return '冲销子行缺少物料凭证项次，请展开明细确认后重新加入列表';
    }
    const requiredItems = resolveRequiredCancelSapItemsForGroup(normalized);
    if (requiredItems.length <= 1 && childLines.length > 0) {
      return '存在子行但未汇总到多个凭证项次，请重新从历史记录加入冲销列表';
    }
    const uniqueChildItems = new Set(childItems);
    if (uniqueChildItems.size < childItems.length) {
      return '冲销子行凭证项次重复，请检查移动历史数据';
    }
  }
  return null;
};
