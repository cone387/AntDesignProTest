import {
  DailyMoment,
  MomentGroup,
  MomentItem,
  createMoment,
  requestMoments,
  requestMomentsGroup,
} from '@/services/event/moment';
import { uploadMeida } from '@/services/media/qiniu_clound';
import {
  EnvironmentOutlined,
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import { Button, Col, DatePicker, Form, Input, Row, Space, Tag, Timeline, Upload } from 'antd';
import { Store } from 'antd/lib/form/interface';
import { UploadChangeParam, UploadFile } from 'antd/lib/upload';
import DayJS from 'dayjs';
import MomentUtil from 'moment';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import type { ChangeEventHandler, Key } from 'react';
import { useEffect, useRef, useState } from 'react';

function toDailyMoment(moments: MomentItem[]) {
  const mapping: { [key: string]: any } = {};
  for (const item of moments) {
    const date = item.event_time.split(' ')[0];
    let moments = mapping[date];
    if (!moments) {
      moments = mapping[date] = [];
    }
    moments.push(item);
  }
  return Object.keys(mapping).map((key) => ({ date: key, moments: mapping[key] }));
}

interface CreateFunction {
  (moment: MomentItem): void;
}

const now = MomentUtil(new Date().getTime());

const EditingMomentItem = {
  content: '',
  id: -1,
  event_time: now.format('YYYY-MM-DD HH:mm:ss'),
  create_time: now.format('YYYY-MM-DD HH:mm:ss'),
  extra: {},
  feeling: '',
  tags: [],

  reset() {
    this.content = '';
  },
};

interface OnDateTimeChangedFunction {
  (datetime: string): void;
}

const MomentDateTimePicker = ({
  defaultValue,
  onChanged,
}: {
  defaultValue?: string;
  onChanged: OnDateTimeChangedFunction;
}) => {
  const now = new Date();
  const momentUtil = MomentUtil(now.getTime());
  const today = DayJS(momentUtil.format('YYYY-MM-DD'));

  let pickedDateTime = defaultValue ?? momentUtil.format('YYYY-MM-DD HH:mm:ss');

  const onDateTimePicked = (date: DayJS.Dayjs | null) => {
    if (date !== null) {
      pickedDateTime = date.format('YYYY-MM-DD HH:mm:ss');
      if (defaultValue !== pickedDateTime) {
        onChanged(pickedDateTime);
      }
    }
  };

  const disabledDate = (date: DayJS.Dayjs) => {
    return !date.isBefore(now);
  };

  const disabledTime = (date: DayJS.Dayjs | null) => {
    if (date === null) {
      return {};
    }
    if (date.isSame(today))
      return {
        disabledHours: () =>
          Array.from({ length: 24 }, (item, index) => index).filter((e) => e > now.getHours()),
        disabledMinutes: (hour: number) => {
          if (hour === now.getHours()) {
            return Array.from({ length: 60 }, (item, index) => index).filter(
              (e) => e > now.getMinutes(),
            );
          }
          return [];
        },
        disabledSeconds: (hour: number, minute: number) => {
          if (hour === now.getHours() && minute === now.getMinutes()) {
            return Array.from({ length: 60 }, (item, index) => index).filter(
              (e) => e > now.getSeconds(),
            );
          }
          return [];
        },
      };
    return {};
  };

  return (
    <DatePicker
      defaultValue={DayJS(pickedDateTime)}
      onOk={onDateTimePicked}
      disabledDate={disabledDate}
      disabledTime={disabledTime}
      showTime={true}
    />
  );
};

const MomentForm = ({ onCreated }: { onCreated: CreateFunction }) => {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);

  const onFinish = (values: Store) => {
    const time = MomentUtil(new Date().getTime());
    const event_time = time.format('YYYY-MM-DD HH:mm:ss');
    const moment = { ...EditingMomentItem, event_time: event_time, content: values['content'] };

    createMoment(moment).then((created) => {
      form.setFieldValue('content', '');
      setTags([]);
      onCreated(created);
    });
  };

  const onMomentDateTimeChanged: OnDateTimeChangedFunction = (datetime) => {
    EditingMomentItem.event_time = datetime;
  };

  const handleInputChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    // 处理输入的文本，并提取标签
    EditingMomentItem.content = e.target.value;
    const inputText = e.target.value;
    const extractedTags = inputText.match(/#[^\s#]+/g) || [];
    setTags(extractedTags);
  };

  // 实际any = UploadRef; 但是用UploadRef的话，因为uploadRef.current?.upload.uploader为private，编辑器会报红
  // 如果不加any的话，同样会报红<Property 'upload' does not exist on type 'never'>
  const uploadRef = useRef<any>();

  const onUploadClick = () => {
    uploadRef.current?.upload.uploader.onClick();
  };

  const onChange = (info: UploadChangeParam<UploadFile<any>>) => {
    console.log('onChange: ', info);
  };

  // const action = (file: UploadFile<any>) => {
  //   console.log(file);
  //   return requestUploadToken({model: 'moment', file: file}).then((response) => {
  //     return "http://127.0.0.1:8002/event/storage/"
  //   });
  // };

  const customRequest = (options: UploadRequestOption) => {
    console.log('customRequest: ', options);
    uploadMeida(
      { file: options.file as File, model: 'moment' },
      {
        complete: (response) => {
          console.log('complete: ', response);
          options.onSuccess?.(response);
        },
        error: (error) => {
          console.log('error: ', error);
          options.onError?.(error);
        },
        next: (res) => {
          console.log('onProgress: ', res.total.percent);
          options.onProgress?.({ percent: res.total.percent });
        },
      },
    );
  };

  return (
    <Form name="MomentForm" onFinish={onFinish} form={form}>
      <div style={{ marginBottom: '5px' }}>
        {tags.map((tag, index) => (
          <Tag key={index} color="blue">
            {tag}
          </Tag>
        ))}
      </div>
      <Form.Item name="content" rules={[{ required: true, message: 'Please input your content!' }]}>
        <Input.TextArea
          placeholder="What's happening?"
          autoSize={{ minRows: 3, maxRows: 6 }}
          // value={EditingMomentItem.content}
          onChange={handleInputChange}
        />
      </Form.Item>
      {/*  'picture' | 'picture-card' | 'picture-circle' */}
      <Upload
        listType="picture-card"
        ref={uploadRef}
        maxCount={10}
        onChange={onChange}
        customRequest={customRequest}
      ></Upload>
      <Form.Item name="location">
        <Row justify="space-between">
          <Col span={10}>
            <Space>
              <MomentDateTimePicker
                defaultValue={EditingMomentItem.event_time}
                onChanged={onMomentDateTimeChanged}
              ></MomentDateTimePicker>
              <Button type="primary" icon={<EnvironmentOutlined />} />
              <Button icon={<SmileOutlined />} />
              <Button icon={<PictureOutlined />} onClick={onUploadClick}></Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />}></Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};

const MomentTimeline = ({ moments }: { moments: MomentItem[]; onCreated: CreateFunction }) => {
  const items = moments.map((e) => ({
    label: e.event_time.split(' ')[1],
    children: e.content,
  }));
  return <Timeline mode="left" items={items} />;
};

const MomentPage = () => {
  // Moments.sort((a, b) => (b.date.localeCompare(a.date)));
  const [moments, setMoments] = useState<MomentItem[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly Key[]>([]);
  // const [month] = useState<string>(DayJS().format('YYYY-MM'));
  const [groups, setGroups] = useState<MomentGroup[]>([]);

  const dayiyMoment: DailyMoment[] = toDailyMoment(moments);

  const OnMomentCreated = (moment: MomentItem) => {
    setMoments([moment, ...moments]);
  };

  function requestGroupMoments(month?: string) {
    requestMoments({ month: month }).then((response) => {
      setMoments(response.results);
      if (response.results.length > 0) {
        setExpandedRowKeys([response.results[0].event_time.split(' ')[0]]);
      }
    });
  }

  useEffect(() => {
    requestMomentsGroup().then((momentGroups) => {
      setGroups(momentGroups);
      requestGroupMoments(momentGroups[0]?.[0]);
    });
  }, []);

  function onMonthChanged(month: DayJS.Dayjs | null) {
    requestGroupMoments(month?.format('YYYY-MM'));
  }

  function disabledDate(current: DayJS.Dayjs) {
    // Can not select days before today and today
    // return current && current > DayJS().endOf('day');
    for (const group of groups) {
      if (group[0] === current.format('YYYY-MM')) {
        return false;
      }
    }
    return true;
  }
  return (
    <>
      <MomentForm onCreated={OnMomentCreated}></MomentForm>
      <Space>
        <DatePicker
          onChange={onMonthChanged}
          picker="month"
          disabledDate={disabledDate}
          format={'YYYY年MM月'}
        />
      </Space>
      <ProList<DailyMoment>
        rowKey="date"
        // headerTitle="支持展开的列表"
        // actionRef={}
        // search={{}}
        // pagination={{
        //   defaultPageSize: 5,
        //   showSizeChanger: true,
        //   pageSize: 5,
        //   total: moments.length,
        //   onChange(page, pageSize) {
        //     console.log("page", page, pageSize)
        //   },
        // }}
        expandable={{
          onExpandedRowsChange: setExpandedRowKeys,
          // expandRowByClick: true,
          expandedRowKeys: expandedRowKeys,
        }}
        dataSource={dayiyMoment}
        metas={{
          title: { render: (dom, item) => item.date, dataIndex: 'date', title: '日期' },
          description: {
            render: (dom, item) => {
              return (
                <div style={{ marginTop: 20 }}>
                  <MomentTimeline
                    moments={item.moments}
                    onCreated={OnMomentCreated}
                  ></MomentTimeline>
                </div>
              );
            },
          },
          // avatar: {},
          content: {},
          actions: {},
          subTitle: {
            render: (dom, item) => {
              return (
                <Space size={0}>
                  <Tag color="blue">{item.moments.length} moments</Tag>
                </Space>
              );
            },
          },
        }}
      />
    </>
  );
};

export default MomentPage;
