import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { AttendanceCostCenterOption, MesReportHRDifferenceDataChartVO, MesReportHRDifferenceDataQuery, MesReportHRDifferenceDataVO } from './types';

/** 查询当前租户存在ZhiJian_001直接人员的成本中心选项。 */
export const listAttendanceCostCenters = (): AxiosPromise<AttendanceCostCenterOption[]> => {
  return request({
    url: '/wms/report/mesReportHRDifferenceData/cost-centers',
    method: 'get'
  });
};

/**
 * 分页查询HR考勤与MES报工差异。
 *
 * @param data 时间范围、工号及分页查询条件
 * @returns 差异报表分页响应
 */
export const listMesReportHRDifferenceData = (data: MesReportHRDifferenceDataQuery): AxiosPromise<MesReportHRDifferenceDataVO[]> => {
  return request({
    url: '/wms/report/mesReportHRDifferenceData/list',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};

/**
 * 查询HR视角图表分析使用的完整差异数据。
 *
 * @param data 时间范围及工号查询条件
 * @returns 当前筛选范围内的图表分析数据
 */
export const getMesReportHRDifferenceDataChart = (data: MesReportHRDifferenceDataQuery): AxiosPromise<MesReportHRDifferenceDataChartVO> => {
  return request({
    url: '/wms/report/mesReportHRDifferenceData/chart',
    method: 'post',
    data
  });
};
