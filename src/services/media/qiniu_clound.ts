import { request } from '@umijs/max';
import * as qiniu from 'qiniu-js';
import { UploadProgress } from 'qiniu-js/esm/upload';
import { PartialObserver } from 'qiniu-js/esm/utils';

export interface TokenResponse {
  token: string;
  key: string;
}

export function requestUploadToken(
  params: {
    model: string;
    file: File;
  },
  options?: { [key: string]: any },
): Promise<TokenResponse> {
  return request('http://127.0.0.1:8002/event/storage/token/', {
    method: 'GET',
    params: {
      model: params.model,
      filename: params.file.name,
    },
    ...(options || {}),
  });
}

export async function uploadMeida(
  params: {
    file: File;
    model: string;
  },
  observer: {
    next?: (res: UploadProgress) => void;
    error?: (err: any) => void;
    complete?: (res: any) => void;
  },
) {
  const response = await requestUploadToken(params);
  const observable = qiniu.upload(params.file, response.key, response.token);
  const subscription = observable.subscribe(observer as PartialObserver<UploadProgress, any, any>);
  // const subscription = observable.subscribe(next, error, complete) // 这样传参形式也可以
  // subscription.unsubscribe() // 上传取消
}
