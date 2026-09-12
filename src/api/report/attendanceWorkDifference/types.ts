/** HR员工考勤与MES报工差异查询参数。 */
export interface AttendanceWorkDifferenceQuery extends PageQuery {
  /** 查询开始时间，包含该时刻，格式为YYYY-MM-DD HH:mm:ss。 */
  beginTime?: string;
  /** 查询结束时间，不包含该时刻，格式为YYYY-MM-DD HH:mm:ss。 */
  endTime?: string;
  /** 单个员工工号，兼容单值查询。 */
  employeeId?: string;
  /** 批量查询的员工工号集合。 */
  employeeIdList?: string[];
  /** 批量输入的工号字符串，支持逗号、分号和空白字符分隔。 */
  employeeIdStr?: string;
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
  /** MES有报工但HR没有排班。 */
  mesReportedWithoutSchedule?: boolean;
  /** HR与MES时间范围是否存在差异。 */
  timeRangeDifferent?: boolean;
  /** HR与MES时间范围比较结果。 */
  timeRangeStatus?: string;
}

/** HR员工考勤与MES报工差异图表分析结果。 */
export interface AttendanceWorkDifferenceChartVO {
  /** 当前筛选范围内不分页的差异明细。 */
  rows: AttendanceWorkDifferenceVO[];
  /** 有HR考勤数据的员工人数，按工号去重。 */
  hrEmployeeCount: number;
  /** 有MES成功报工记录的员工人数，按工号去重。 */
  mesReportEmployeeCount: number;
}
