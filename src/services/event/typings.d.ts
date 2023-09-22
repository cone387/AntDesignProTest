// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    username?: string;
    email?: string;
    is_active?: string;
    email?: string;
    last_login?: string;
    date_joined?: string;
    avatar?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    is_superuser?: boolean;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    refresh?: string;
    access?: string;
    detail?: string;
    type?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };
}

type NullableString = string | null;

declare namespace Event {
  interface Tag {
    id: number;
    name: string;
    color: string;
  }
}

declare interface Json {
  [key: string]: any;
}

declare namespace Media {
  interface Item {
    key: any;
    id: number;
    size: number;
    type: string;
    uri: string;
    model: string;
    extra: Json;
    engine: number;
    upload_time: string;
  }
}

declare interface Device {
  ua?: string;
  ip?: string;
}

declare interface Location {
  latitude?: number;
  longitude?: number;
}

declare namespace Moment {
  type GroupDimension = 'month' | 'feeling' | 'tag';

  interface DailyMoment {
    date: string;
    moments: MomentItem[];
  }

  interface ListResponse {
    count: number;
    next: NullableString;
    previous: NullableString;
    results: MomentItem[];
  }

  interface Feeling {
    id: number;
    emoji: string;
    name: string;
  }

  interface FormItem {
    post_feeling?: number | null;
    post_tags?: NullableString; // 按逗号分隔
    content: string;
    post_medias: number[];
    event_time: string;
    extra?: Json | null;
    [key: string]: any;
  }

  interface Extra {
    device?: Device;
    location?: Location;
    Json;
  }

  interface Item {
    id: number;
    feeling: Feeling | null;
    tags: Event.Tag[];
    content: string;
    medias: Media.Item[];
    media_info: number[] | null;
    event_time: string;
    create_time: string;
    extra: Extra;
  }

  interface QueryParams {
    // ?content__contains=大厦大&feeling__emoji=&feeling__name=&event_time__gte=&event_time__lte=&create_time__gte=&create_time__lte=&tag=&date=&month=
    content__contains?: NullableString;
    feeling__emoji?: NullableString;
    feeling__name?: NullableString;
    event_time__gte?: NullableString;
    event_time__lte?: NullableString;
    create_time__gte?: NullableString;
    create_time__lte?: NullableString;
    tag?: NullableString;
    date?: NullableString;
    month?: NullableString;
    page?: number;
    page_size?: number;
  }

  interface MonthGroup {
    month: string;
    count: number;
  }

  interface FeelingGroup extends Feeling {
    count: number;
  }

  interface TagGroup {
    tags__name: string;
    tags__color: string;
    count: number;
  }

  interface Group {
    month?: MonthGroup[];
    feeling?: FeelingGroup[];
    tag?: TagGroup[];
  }
}
