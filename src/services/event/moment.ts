// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { Key } from 'react';

export async function requestMomentsGroup(
  params?: {
    by: Moment.GroupDimension;
  },
  options?: { [key: string]: any },
): Promise<Moment.Group> {
  const by = params?.by ?? 'month';
  return request('http://127.0.0.1:8002/event/moment/group/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function requestMoments(
  params?: Moment.QueryParams,
  options?: { [key: string]: any },
): Promise<Moment.ListResponse> {
  return request('http://127.0.0.1:8002/event/moment/', {
    method: 'GET',
    params: {
      page: 1,
      page_size: 10,
      ...params,
    },
    ...(options || {}),
  });
}

export async function createMoment(
  moment: Moment.FormItem,
  options?: { [key: string]: any },
): Promise<Moment.Item> {
  return request('http://127.0.0.1:8002/event/moment/', {
    method: 'POST',
    data: moment,
    ...(options || {}),
  });
}

export async function deleteMoment(
  id: Key,
  options?: { [key: string]: any },
): Promise<Moment.Item> {
  return request('http://127.0.0.1:8002/event/moment/${id}/', {
    method: 'DELETE',
    ...(options || {}),
  });
}
