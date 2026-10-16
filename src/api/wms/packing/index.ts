import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PackingVO, PackingForm, PackingQuery, PackingExtVO } from '@/api/wms/packing/types';

/**
 * 工单和打包明细都存在 status 字段，但含义和类型不同：
 * 工单状态是字符串（如 RELEASABLE），打包状态是数字。
 * 保存打包记录时明细状态由后端业务处理，提交前统一移除，避免字段污染。
 */
const preparePackingData = (data: PackingForm, isUpdate: boolean): PackingForm => {
  const normalizedData: PackingForm = {
    ...data,
    packingDetailBoList: Array.isArray(data.packingDetailBoList)
      ? data.packingDetailBoList.map((detail) => {
          const normalizedDetail = { ...detail };
          delete normalizedDetail.status;
          // 明细由后端按主表打包编号重新生成，禁止沿用页面中的旧主键和关联字段
          delete normalizedDetail.id;
          delete normalizedDetail.packingCode;
          delete normalizedDetail.palletCode;
          return normalizedDetail;
        })
      : []
  };
  delete (normalizedData as PackingForm & { packingDetailVoList?: unknown }).packingDetailVoList;

  // 新增时主键和打包编号均由后端生成，避免弹窗残留数据误走错误关联
  if (!isUpdate) {
    delete normalizedData.id;
    delete normalizedData.packingCode;
  }
  return normalizedData;
};

/**
 * 查询打包记录列表
 * @param query
 * @returns {*}
 */

export const listPacking = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/packing/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包记录列表
 * @param query
 * @returns {*}
 */

export const listDeptDataPackingDetail = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/packing/deptDataPackingDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包及明细记录列表
 * @param query
 * @returns {*}
 */

export const listPackingAndDetail = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/packing/packingDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包及明细记录列表
 * @param query
 * @returns {*}
 */
export const listScadaPackingAndDetail = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/report/packing/detail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包记录详细
 * @param id
 */
export const getPacking = (id: string | number): AxiosPromise<PackingVO> => {
  return request({
    url: '/wms/packing/' + id,
    method: 'get'
  });
};

/**
 * 新增打包记录
 * @param data
 */
export const addPacking = (data: PackingForm) => {
  return request({
    url: '/wms/packing',
    method: 'post',
    data: preparePackingData(data, false)
  });
};

/**
 * 修改打包记录
 * @param data
 */
export const updatePacking = (data: PackingForm) => {
  return request({
    url: '/wms/packing',
    method: 'put',
    data: preparePackingData(data, true)
  });
};
/**
 * 生成打包后工单标签
 * @param data
 */
export const generatePackingDetailSn = (data: PackingForm) => {
  return request({
    url: '/wms/packing/generatePackingDetailSn',
    method: 'put',
    data: data
  });
};

/**
 * 删除打包记录
 * @param id
 */
export const delPacking = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packing/' + id,
    method: 'delete'
  });
};

/**
 * 保存栈板送仓记录
 * @param data
 */
export const inBoundPending = (data: PackingForm) => {
  return request({
    url: '/wms/packing/inbound/pending',
    method: 'put',
    data: data
  });
};

/**
 * 保存栈板退回记录
 * @param data
 */
export const rejectPacking = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packing/reject/' + id,
    method: 'put'
  });
};

/**
 * 保存栈板接收记录
 * @param data
 */
export const receivePacking = (data: PackingExtVO) => {
  return request({
    url: '/wms/packing/receive',
    method: 'put',
    data: data
  });
};

/**
 * 保存栈板退料记录
 * @param data
 */
export const returnPacking = (data: PackingExtVO) => {
  return request({
    url: '/wms/packing/return',
    method: 'put',
    data: data
  });
};
