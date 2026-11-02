import request from '@/utils/request';
import { AxiosPromise } from 'axios';

/**
 * 上传附件到 QMS-352 文件接口。
 * Excel 业务数据不要走这个接口。
 */
export const uploadQms352Attachment = (data: FormData, fileModule?: string): AxiosPromise<any> => {
  return request({
    url: '/qms352/file/external/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
      fileModule: fileModule || 'external',
      repeatSubmit: false
    }
  });
};
