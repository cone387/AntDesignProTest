// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { Key } from 'react';


export interface MomentItem{
  id: number;
  content: string;
  event_time: string;
  create_time: string;
  extra: {[key: string]: any};
  feeling?: string;
  tags: string[];
}


export type GroupDimension = "week" | "month" | "year";

export interface DailyMoment {
  date: string;
  moments: MomentItem[];
}

// export interface MomentGroup {
//   // [count: number;
//   // [key: string]: MomentGroupDimension | number;]
  
// }

export type MomentGroup = [
  string,
  number
];

export interface MomentResponse {
  count: number;
  next: string;
  previous: string;
  results: MomentItem[];
}


export async function requestMomentsGroup(
  params?: {
    by: GroupDimension
  },
  options?: { [key: string]: any },
): Promise<MomentGroup[]> {
  const by = params?.by?? "month";
  return request(`http://127.0.0.1:8002/event/moment/group/${by}/`, {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}



export async function requestMoments(
  params?: {
    month?: string;
    date?: string;
    tag?: string;
    eventTime?: string;
    createTime?: string;
  },
  options?: { [key: string]: any },
): Promise<MomentResponse> {
  return request('http://127.0.0.1:8002/event/moment/', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}


export async function createMoment(
  moment: MomentItem,
  options?: { [key: string]: any },
): Promise<MomentItem> {
  return request('http://127.0.0.1:8002/event/moment/', {
    method: 'POST',
    data: moment,
    ...(options || {}),
  });
}


export async function deleteMoment(
  id: Key,
  options?: { [key: string]: any },
): Promise<MomentResponse> {
  return request('http://127.0.0.1:8002/event/moment/${id}/', {
    method: 'DELETE',
    ...(options || {}),
  });
}
