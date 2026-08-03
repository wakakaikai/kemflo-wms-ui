import request from '@/utils/request';
import { CredentialForm, CredentialQuery, CredentialVO } from './types';
import { AxiosPromise } from 'axios';

// 查询凭证列表
export function listCredential(query: CredentialQuery): AxiosPromise<CredentialVO[]> {
  return request({
    url: '/integration/credential/list',
    method: 'get',
    params: query
  });
}

// 查询凭证详细
export function getCredential(credentialId: string | number): AxiosPromise<CredentialVO> {
  return request({
    url: '/integration/credential/' + credentialId,
    method: 'get'
  });
}

// 新增凭证
export function addCredential(data: CredentialForm) {
  return request({
    url: '/integration/credential',
    method: 'post',
    data: data
  });
}

// 修改凭证
export function updateCredential(data: CredentialForm) {
  return request({
    url: '/integration/credential',
    method: 'put',
    data: data
  });
}

// 删除凭证
export function delCredential(credentialId: string | number | Array<string | number>) {
  return request({
    url: '/integration/credential/' + credentialId,
    method: 'delete'
  });
}
