import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MaterialUnitConversionVO, MaterialUnitConversionForm, MaterialUnitConversionQuery } from '@/api/wms/materialUnitConversion/types';

/**
 * 查询物料计量单位转换列表
 * @param query
 * @returns {*}
 */

export const listMaterialUnitConversion = (query?: MaterialUnitConversionQuery): AxiosPromise<MaterialUnitConversionVO[]> => {
  return request({
    url: '/wms/materialUnitConversion/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询物料计量单位转换详细
 * @param id
 */
export const getMaterialUnitConversion = (id: string | number): AxiosPromise<MaterialUnitConversionVO> => {
  return request({
    url: '/wms/materialUnitConversion/' + id,
    method: 'get'
  });
};

/**
 * 新增物料计量单位转换
 * @param data
 */
export const addMaterialUnitConversion = (data: MaterialUnitConversionForm) => {
  return request({
    url: '/wms/materialUnitConversion',
    method: 'post',
    data: data
  });
};

/**
 * 修改物料计量单位转换
 * @param data
 */
export const updateMaterialUnitConversion = (data: MaterialUnitConversionForm) => {
  return request({
    url: '/wms/materialUnitConversion',
    method: 'put',
    data: data
  });
};

/**
 * 删除物料计量单位转换
 * @param id
 */
export const delMaterialUnitConversion = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/materialUnitConversion/' + id,
    method: 'delete'
  });
};
