import axios from 'axios';
import type { AxiosPromise } from 'axios';
import { HttpStatus } from '@/enums/RespEnum';
import { getLanguage } from '@/lang';
import { getToken } from '@/utils/auth';
import { errorCode } from '@/utils/errorCode';
import { formatApiErrorMessage } from '@/utils/formatApiErrorMessage';
import type { PalletOutboundBindVO } from './types';

interface ApiResponseBody<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

const resolveApiMessage = (body: ApiResponseBody) => {
  const code = body.code ?? HttpStatus.SUCCESS;
  const rawMsg = errorCode[code] || body.msg || errorCode['default'];
  return formatApiErrorMessage(rawMsg) || errorCode['default'];
};

/**
 * 栈板绑定专用请求：错误由页面 el-alert 展示，不经过全局 request 拦截器的 ElMessage。
 */
export const bindOutboundPalletSilent = (
  bindId: string | number,
  palletNo: string
): AxiosPromise<PalletOutboundBindVO> => {
  return axios
    .post<ApiResponseBody<PalletOutboundBindVO>>(
      `${import.meta.env.VITE_APP_BASE_API}/wms/palletOutboundBind/bindPallet`,
      { bindId, palletNo },
      {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          clientid: import.meta.env.VITE_APP_CLIENT_ID,
          Authorization: `Bearer ${getToken()}`,
          'Content-Language': getLanguage()
        }
      }
    )
    .then((res) => {
      const body = res.data;
      const code = body.code ?? HttpStatus.SUCCESS;
      if (code !== HttpStatus.SUCCESS) {
        return Promise.reject(new Error(resolveApiMessage(body)));
      }
      return body as ApiResponseBody<PalletOutboundBindVO>;
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        return Promise.reject(error);
      }
      const body = (error as { response?: { data?: ApiResponseBody } })?.response?.data;
      if (body) {
        return Promise.reject(new Error(resolveApiMessage(body)));
      }
      return Promise.reject(error);
    }) as AxiosPromise<PalletOutboundBindVO>;
};
