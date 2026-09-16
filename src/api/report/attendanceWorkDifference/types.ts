/** HR员工考勤与MES报工差异查询参数。 */
export interface AttendanceWorkDifferenceQuery extends PageQuery {
  /** 班次开始日期范围起点，格式为YYYY-MM-DD。 */
  beginDate?: string;
  /** 班次开始日期范围终点，格式为YYYY-MM-DD。 */
  endDate?: string;
  /** 兼容旧调用的查询开始时间。 */
  beginTime?: string;
  /** 兼容旧调用的查询结束时间。 */
  endTime?: string;
  /** 单个员工工号，兼容单值查询。 */
  employeeId?: string;
  /** 批量查询的员工工号集合。 */
  employeeIdList?: string[];
  /** 批量输入的工号字符串，支持逗号、分号和空白字符分隔。 */
  employeeIdStr?: string;
  /** 用户选择的HR成本中心编码集合。 */
  costCenterCodes?: string[];
}

/** HR考勤报表成本中心选项。 */
export interface AttendanceCostCenterOption {
  /** HR成本中心编码。 */
  costCenterCode: string;
  /** HR成本中心名称。 */
  costCenterName?: string;
}

/** HR员工每日考勤与MES报工差异结果。 */
export interface AttendanceWorkDifferenceVO {
  /** 考勤与报工数据归属日期。 */
  attendanceDate: string;
  /** 日期对应的中文星期。 */
  weekDay?: string;
  /** 员工工号。 */
  employeeId: string;
  /** 员工姓名。 */
  employeeName: string;
  /** 员工所属公司名称。 */
  corporationName?: string;
  /** 员工所属部门名称。 */
  departmentName?: string;
  /** 员工所属部门的上级部门名称。 */
  directDepartmentName?: string;
  /** 员工职位名称。 */
  jobName?: string;
  /** HR成本中心编码，对应CostCenter.Code。 */
  costCenterCode?: string;
  /** HR成本中心描述，对应CostCenter.Name。 */
  costCenterName?: string;
  /** 当天排班班次名称。 */
  rankName?: string;
  /** 当天班次开始时间，后端通常返回HH:mm:ss。 */
  workBeginTime?: string;
  /** 当天班次结束时间，后端通常返回HH:mm:ss。 */
  workEndTime?: string;
  /** HR排班标准工时，单位为小时。 */
  scheduleHours: number;
  /** 当天有效请假工时，单位为小时。 */
  leaveHours: number;
  /** 当天加班工时，单位为小时。 */
  overtimeHours: number;
  /** 当天501平日加班工时。 */
  weekdayOvertimeHours: number;
  /** 当天502假日加班工时。 */
  holidayOvertimeHours: number;
  /** 当天503节日加班工时。 */
  festivalOvertimeHours: number;
  /** HR应计工时，按平日、假日、节日三种公式计算。 */
  attendanceHours: number;
  /** MES成功报工操作工时，单位为小时。 */
  reportHours: number;
  /** 差异工时：MES报工工时-HR应计工时。 */
  differenceHours: number;
  /** 差异状态：一致、报工不足或报工超出。 */
  differenceStatus: '一致' | '报工不足' | '报工超出';
  /** 当天涉及的请假类型ID。 */
  leaveTypeIds?: string;
  /** 当天涉及的请假简称。 */
  leaveTypes?: string;
  /** 当天涉及的加班类型ID。 */
  overtimeTypeIds?: string;
  /** 当天涉及的加班描述，来源于AttendanceType.ShortName。 */
  overtimeTypes?: string;
  /** 当天MES成功报工记录数。 */
  reportCount: number;
  /** HR时段比较类别。 */
  timeRangeCategory?: '平日班次+平日加班' | '假日加班' | '节日加班';
  /** 参与比较的HR开始时间。 */
  hrBeginTime?: string;
  /** 参与比较的HR结束时间。 */
  hrEndTime?: string;
  /** MES当日最早上线时间。 */
  mesBeginTime?: string;
  /** MES当日最晚下线时间。 */
  mesEndTime?: string;
  /** MES开始时间减HR开始时间，单位为分钟。 */
  beginDifferenceMinutes?: number;
  /** MES结束时间减HR结束时间，单位为分钟。 */
  endDifferenceMinutes?: number;
  /** MES开始时间减HR开始时间，展示单位为小时。 */
  beginDifferenceHours?: number;
  /** MES结束时间减HR结束时间，展示单位为小时。 */
  endDifferenceHours?: number;
  /** MES有报工但HR没有排班。 */
  mesReportedWithoutSchedule?: boolean;
  /** HR与MES时间范围是否存在差异。 */
  timeRangeDifferent?: boolean;
  /** HR与MES时间范围比较结果。 */
  timeRangeStatus?: string;
}

/** 间接及办公室人员MES成功报工明细。 */
export interface NonDirectMesReportVO {
  reportDate: string;
  employeeTypeName: '间接' | '办公室' | string;
  employeeTypeCode: 'ZhiJian_002' | 'ZhiJian_003' | string;
  employeeId: string;
  employeeName: string;
  corporationName?: string;
  departmentCode?: string;
  departmentName?: string;
  costCenterCode?: string;
  costCenterName?: string;
  mesBeginTime?: string;
  mesEndTime?: string;
  reportHours: number;
  reportCount: number;
}

/** 成功工单的员工在线明细。 */
export interface AttendanceMesEmployeeOnlineVO {
  reportDate: string;
  reportId: number;
  workCenter?: string;
  shopOrder?: string;
  employeeTypeName?: string;
  employeeTypeCode?: string;
  employeeId: string;
  employeeName?: string;
  corporationName?: string;
  departmentCode?: string;
  departmentName?: string;
  costCenterCode?: string;
  costCenterName?: string;
  mesBeginTime?: string;
  mesEndTime?: string;
  reportHours: number;
  reportCount: number;
}

/** 成功工单的异常时间明细。 */
export interface AttendanceAbnormalTimeVO {
  reportDate: string;
  id: number;
  reportId: number;
  workCenter?: string;
  shopOrder?: string;
  shutdownStartTime?: string;
  shutdownEndTime?: string;
  abnormalClass?: string;
  abnormalType?: string;
  shutdownReason?: string;
  shutdownReasonName?: string;
  shutdownDuration: number;
  effectiveShutdownDuration: number;
  /** 停机时长，展示单位为小时。 */
  shutdownHours: number;
  /** 有效异常时长，展示单位为小时。 */
  effectiveShutdownHours: number;
  costCenterCode?: string;
  costCenterName?: string;
}

/** MES成功工单按日期及工单类型汇总的稽核分析数据。 */
export interface AttendanceShopOrderAnalysisVO {
  reportDate: string;
  workOrderType: string;
  workOrderTypeName: string;
  workOrderCategory: '常规工单' | '重工/返修/拆解' | '打样/研发' | string;
  reportCount: number;
  employeeOperationHours: number;
  personHours: number;
  operationExceptionHours: number;
}

/** HR员工考勤与MES报工差异图表分析结果。 */
export interface AttendanceWorkDifferenceChartVO {
  /** 当前筛选范围内不分页的差异明细。 */
  rows: AttendanceWorkDifferenceVO[];
  /** 有HR考勤数据的员工人数，按工号去重。 */
  hrEmployeeCount: number;
  /** 有MES成功报工记录的员工人数，按工号去重。 */
  mesReportEmployeeCount: number;
  /** 间接及办公室人员MES成功报工明细。 */
  nonDirectReportRows: NonDirectMesReportVO[];
  /** 有成功报工的非直接员工人数。 */
  nonDirectMesReportEmployeeCount: number;
  /** 间接人员MES报工工时。 */
  indirectMesReportHours: number;
  /** 办公室人员MES报工工时。 */
  officeMesReportHours: number;
  /** 非直接人员MES报工总工时。 */
  nonDirectMesReportHours: number;
  /** 成功工单员工在线明细。 */
  employeeOnlineRows: AttendanceMesEmployeeOnlineVO[];
  /** 成功工单异常时间明细。 */
  abnormalTimeRows: AttendanceAbnormalTimeVO[];
  /** 有效异常时长合计，单位为小时。 */
  effectiveShutdownDuration: number;
  /** 成功工单员工操作工时，单位为小时。 */
  employeeOperationHours: number;
  /** 成功工单员工时间，单位为小时。 */
  personHours: number;
  /** 员工操作时间减员工时间，单位为小时。 */
  operationExceptionHours: number;
  /** 操作异常工时占员工操作工时的比例。 */
  operationExceptionRate: number;
  /** ZP81、ZP83、ZP92、ZP94工单员工操作工时。 */
  reworkDisassemblyHours: number;
  /** ZP82、ZP91、ZP99工单员工操作工时。 */
  sampleDevelopmentHours: number;
  /** 成功工单按日期及工单类型汇总的分析数据。 */
  shopOrderAnalysisRows: AttendanceShopOrderAnalysisVO[];
}
