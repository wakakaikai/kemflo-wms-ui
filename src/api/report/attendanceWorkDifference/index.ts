import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { AttendanceWorkDifferenceChartVO, AttendanceWorkDifferenceQuery, AttendanceWorkDifferenceVO } from './types';

/**
 * 分页查询HR考勤与MES报工差异。
 *
 * @param data 时间范围、工号及分页查询条件
 * @returns 差异报表分页响应
 */
export const listAttendanceWorkDifference = (data: AttendanceWorkDifferenceQuery): AxiosPromise<AttendanceWorkDifferenceVO[]> => {
  return request({
    url: '/wms/report/attendanceWorkDifference/list',
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
export const getAttendanceWorkDifferenceChart = (data: AttendanceWorkDifferenceQuery): AxiosPromise<AttendanceWorkDifferenceChartVO> => {
  return request({
    url: '/wms/report/attendanceWorkDifference/chart',
    method: 'post',
    data
  });
};
