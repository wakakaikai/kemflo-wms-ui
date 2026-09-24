import request from '@/utils/request';

export interface ApiLicense {
  id: string | number;
  licenseNo: string;
  licenseKeyPrefix?: string;
  customerName: string;
  status: string;
  policy: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  features: string;
  maxDevices: number;
  heartbeatSeconds: number;
  offlineHours: number;
  validUntil: string;
  createTime?: string;
}

export interface LicenseDevice {
  id: string | number;
  licenseId: string | number;
  deviceFingerprint: string;
  macAddress: string;
  deviceName?: string;
  instanceId?: string;
  status: string;
  leaseExpireTime?: string;
  offlineExpireTime?: string;
  lastHeartbeat?: string;
  lastIp?: string;
}

export interface LicenseActivationResult {
  licenseNo: string;
  deviceFingerprint: string;
  instanceId: string;
  leaseToken: string;
  leaseExpireTime: string;
  offlineCertificate?: string;
  offlineExpireTime?: string;
  heartbeatSeconds: number;
}

/** 后台分页查询 License 列表。 */
export const listLicenses = (params: Record<string, unknown>) => request<ApiLicense[]>({ url: '/wms/license/manage/list', method: 'get', params });
/** 创建 License；明文 licenseKey 只在本次响应中返回。 */
export const createLicense = (data: Record<string, unknown>) => request<{ id: string | number; licenseNo: string; licenseKey: string }>({ url: '/wms/license/manage', method: 'post', data });
/** 由 WMS 管理端为指定 License 激活设备并签发上位机运行配置。 */
export const activateLicenseDevice = (licenseId: string | number, data: Record<string, unknown>) => request<LicenseActivationResult>({ url: `/wms/license/manage/${licenseId}/activate`, method: 'post', data });
/** 查询指定 License 的设备绑定和租约状态。 */
export const listLicenseDevices = (licenseId?: string | number) => request<LicenseDevice[]>({ url: '/wms/license/manage/devices', method: 'get', params: { licenseId } });
/** 撤销 License，并立即终止其所有在线租约。 */
export const revokeLicense = (licenseId: string | number) => request({ url: `/wms/license/manage/${licenseId}/revoke`, method: 'post' });
/** 恢复 License；已绑定设备仍需重新激活获取新租约。 */
export const restoreLicense = (licenseId: string | number) => request({ url: `/wms/license/manage/${licenseId}/restore`, method: 'post' });
/** 解除设备绑定并释放一个授权设备名额。 */
export const unbindLicenseDevice = (deviceId: string | number) => request({ url: `/wms/license/manage/device/${deviceId}`, method: 'delete' });
