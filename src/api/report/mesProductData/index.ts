import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MesProductDataQueryForm } from '@/api/report/mesProductData/types';

/**
 * 查询Mes生产数据知列表
 * @param data
 * @returns {*}
 */
export const listMesProductData = (data: MesProductDataQueryForm) => {
  return request({
    url: '/wms/mes/productData/list',
    method: 'post',
    data: data
  });
};
