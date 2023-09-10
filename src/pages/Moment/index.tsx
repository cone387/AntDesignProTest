import { ProList } from '@ant-design/pro-components';
import { Button, DatePickerProps, Modal, Space, Tag, TimePicker } from 'antd';
import type { ChangeEventHandler, Key } from 'react';
import { useState } from 'react';
import { Timeline, DatePicker } from 'antd';
import { Form, Input } from 'antd';
import { EnvironmentOutlined, SmileOutlined, SendOutlined, ClockCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { Row, Col } from 'antd';
import MomentUtil from 'moment';
import { Store } from 'antd/lib/form/interface';
import DayJS from 'dayjs';
import { TimePickerProps } from 'antd/lib';
import React from 'react';
import { render } from '@testing-library/react';


interface MomentItem{
  // id: number;
  content: string;
  moment_time: string;
  // create_time: string;
}

interface DailyMoment {
  date: string;
  moments: MomentItem[];
}


const MockDailyMoment: DailyMoment[] = [{
  date: "2023-08-09",
  moments: [
      {
        moment_time: '2023-08-09 09:12:11',
        content: 'Create a services',
      },
      {
        moment_time: '2023-08-09 09:12:11',
        content: 'Solve initial network problems',
      },
      {
        moment_time: '2023-08-09 04:12:11',
        content: 'Network problems being solved',
      },
    ]
  },
  {
    date: "2023-08-08",
    moments: [
      {
        moment_time: '2023-08-08 09:12:11',
        content: 'Create a services',
      },
      {
        moment_time: '2023-08-08 09:12:11',
        content: 'Solve initial network problems',
      },
      {
        moment_time: '2023-08-08 04:12:11',
        content: 'Network problems being solved',
      },
    ]
  },
  {
    date: "2023-08-07",
    moments: [
        {
          moment_time: '2023-08-07 09:12:11',
          content: 'Create a services',
        },
        {
          moment_time: '2023-08-07 09:12:11',
          content: 'Solve initial network problems',
        },
        {
          moment_time: '2023-08-07 04:12:11',
          content: 'Network problems being solved',
        },
      ]
    },
];

interface CreateFunction {
  (moment: MomentItem): void;
}


const now = MomentUtil(new Date().getTime());

const EditingMomentItem = {
  momentTime: now.format("YYYY-MM-DD HH:mm:ss"),
  content: "",

  reset(){
    this.content = "";
  },
  
}


interface OnDateTimeChangedFunction{
  (datetime: string): void;
}


const MomentDateTimePicker = ({defaultValue, onChanged}:{defaultValue?: string, onChanged: OnDateTimeChangedFunction}) => {
  const now = new Date();
  const momentUtil = MomentUtil(now.getTime());
  const today = DayJS(momentUtil.format('YYYY-MM-DD'));

  let pickedDateTime = defaultValue?? momentUtil.format('YYYY-MM-DD HH:mm:ss');

  const onDateTimePicked = (date: DayJS.Dayjs | null) => {
    if(date !== null){
      pickedDateTime = date.format('YYYY-MM-DD HH:mm:ss');
      if(defaultValue !== pickedDateTime){
        onChanged(pickedDateTime);
      }
    }
  };

  const disabledDate = (date: DayJS.Dayjs) => {
    return !date.isBefore(now);
  }

  const disabledTime = (date: DayJS.Dayjs | null) => {
    if(date === null){return {}};
    if(date.isSame(today))
      return {
        disabledHours: () => Array.from({length: 24}, (item, index) => index).filter((e) => e > now.getHours()),
        disabledMinutes: (hour: number) => {
          if(hour === now.getHours()){
            return Array.from({length: 60}, (item, index) => index).filter((e) => e > now.getMinutes());
          }
          return [];
        },
        disabledSeconds: (hour: number, minute: number) => {
          if(hour === now.getHours() && minute === now.getMinutes()){
            return Array.from({length: 60}, (item, index) => index).filter((e) => e > now.getSeconds());
          }
          return [];
        },
      }
    return {};
  }
  
  return (
    <DatePicker defaultValue={DayJS(pickedDateTime)} onOk={onDateTimePicked}
            disabledDate={disabledDate} disabledTime={disabledTime} showTime={true}/>
  );
}


const MomentForm = ({onCreated}: {onCreated: CreateFunction}) => {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);

  const onFinish = (values: Store) => {
    const time = MomentUtil(new Date().getTime());
    const date = time.format('YYYY-MM-DD');
    const moment_time = time.format('YYYY-MM-DD HH:mm:ss');
    let moments: MomentItem[] = [];
    for (const item of MockDailyMoment) {
      if(item.date === date){
        moments = item.moments;
        break;
      }
    }

    if(moments.length === 0){
      MockDailyMoment.unshift({date: date, moments: moments});
    }
    const moment = {moment_time: moment_time, content: values["content"]};
    moments.unshift(moment);
    onCreated(moment);
    form.setFieldValue("content", "");
    setTags([]);
  };

  const onMomentDateTimeChanged: OnDateTimeChangedFunction = (datetime) =>{
    EditingMomentItem.momentTime = datetime;
  }

  const handleInputChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    // 处理输入的文本，并提取标签
    EditingMomentItem.content = e.target.value;
    const inputText = e.target.value;
    const extractedTags = inputText.match(/#[^\s#]+/g) || [];
    setTags(extractedTags);
  };


  return (
    <Form
      name="MomentForm"
      onFinish={onFinish}
      form={form}
    >
      <div style={{ marginBottom: '5px' }}>
        {tags.map((tag, index) => (
          <Tag key={index} color="blue">
            {tag}
          </Tag>
        ))}
      </div>
      <Form.Item
        name="content"
        rules={[{ required: true, message: 'Please input your content!' }]}
      >
        <Input.TextArea 
          placeholder="What's happening?" 
          autoSize={{ minRows: 3, maxRows: 6 }} 
          // value={EditingMomentItem.content} 
          onChange={handleInputChange}
        />
      </Form.Item>
      
      <Form.Item name="location">
        <Row justify="space-between">
          <Col span={10}>
            <Space>
            <MomentDateTimePicker defaultValue={EditingMomentItem.momentTime} onChanged={onMomentDateTimeChanged}></MomentDateTimePicker>
            <Button type="primary" icon={<EnvironmentOutlined />} />
            <Button icon={<SmileOutlined />} />
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


const MomentTimeline = (
  {moments}: {moments: MomentItem[], onCreated: CreateFunction
}) => {
  const items = moments.map((e) => ({
    label: e.moment_time.split(' ')[1], 
    children: e.content}));
  return (
    <Timeline
        mode="left"
        items={items} 
    />
  );
};


const MomentPage = () => {
  MockDailyMoment.sort((a, b) => (b.date.localeCompare(a.date)));
  const [defaultExpandedRowKeys, setExpandedRowKeys] = useState<readonly Key[]>(
    [MockDailyMoment[0].date],
  );
  const [dayiyMoment, setDailyMoment] = useState<DailyMoment[]>(MockDailyMoment);
  
  const OnMomentCreated = () => {
    setDailyMoment([...MockDailyMoment]);
  }

  return (
    <>
    <MomentForm onCreated={OnMomentCreated}></MomentForm>
    <ProList<DailyMoment>
      rowKey="day"
      // headerTitle="支持展开的列表"
      // actionRef={}
      expandable={{
        onExpandedRowsChange: setExpandedRowKeys,
        // expandRowByClick: true,
        defaultExpandedRowKeys: defaultExpandedRowKeys
      }}
      dataSource={dayiyMoment}
      metas={{
        title: { render: (dom, item) => item.date},
        description: {
          render: (dom, item) => {
            return <div style={{ marginTop: 20 }}><MomentTimeline moments={item.moments} onCreated={OnMomentCreated}></MomentTimeline></div>
          },
        },
        // avatar: {},
        content: {},
        actions: {},
        extra: {},
        subTitle: {
          render: (dom, item) => {
            return <Space size={0}>
                <Tag color="blue">{item.moments.length} moments</Tag>
              </Space>
          }
        }
      }}
    />
    </>
  );
};


export default MomentPage;