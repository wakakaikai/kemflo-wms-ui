import request from '@/utils/request';

export const listSupplierUser = (params: any) => request({ url: '/wms/supplierUser/list', method: 'get', params });
export const addSupplierUser = (data: any) => request({ url: '/wms/supplierUser', method: 'post', data });
export const updateSupplierUser = (data: any) => request({ url: '/wms/supplierUser', method: 'put', data });
export const deleteSupplierUser = (id: string | number) => request({ url: `/wms/supplierUser/${id}`, method: 'delete' });
