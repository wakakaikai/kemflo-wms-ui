import request from '@/utils/request';
import { MesProductDataForm } from '@/api/report/mesProductData/types';

/**
 * 查询Mes生产数据知列表
 * @param data
 * @returns {*}
 */
export const listMesProductData = (data: MesProductDataForm) => {
  return request({
    url: '/wms/mes/productData/list',
    method: 'post',
    data: data,
    timeout: 180000
  });
};
