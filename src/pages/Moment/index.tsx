import { ProList } from '@ant-design/pro-components';
import { Button, DatePickerProps, Modal, Space, Tag, TimePicker } from 'antd';
import type { Key } from 'react';
import { useState } from 'react';
import { Timeline, DatePicker } from 'antd';
import { Form, Input } from 'antd';
import { EnvironmentOutlined, SmileOutlined, SendOutlined, ClockCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { Row, Col } from 'antd';
import MomentUtil from 'moment';
import { Store } from 'antd/lib/form/interface';
import dayjs from 'dayjs';
import { TimePickerProps } from 'antd/lib';


interface MomentItem{
  // id: number;
  datetime: string;
  content: string;
}

interface DailyMoment {
  day: string;
  moments: MomentItem[];
}


const MockDailyMoment: DailyMoment[] = [{
  day: "2023-08-09",
  moments: [
      {
        datetime: '09:12:11',
        content: 'Create a services',
      },
      {
        datetime: '09:12:11',
        content: 'Solve initial network problems',
      },
      {
        datetime: '04:12:11',
        content: 'Network problems being solved',
      },
    ]
  },
  {
    day: "2023-08-08",
    moments: [
      {
        datetime: '09:12:11',
        content: 'Create a services',
      },
      {
        datetime: '09:12:11',
        content: 'Solve initial network problems',
      },
      {
        datetime: '04:12:11',
        content: 'Network problems being solved',
      },
    ]
  },
  {
    day: "2023-08-07",
    moments: [
        {
          datetime: '09:12:11',
          content: 'Create a services',
        },
        {
          datetime: '09:12:11',
          content: 'Solve initial network problems',
        },
        {
          datetime: '04:12:11',
          content: 'Network problems being solved',
        },
      ]
    },
];

interface CreateFunction {
  (moment: MomentItem): void;
}

const MomentForm = ({onCreated}: {onCreated: CreateFunction}) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onFinish = (values: Store) => {
    console.log('Received values:', values);
    const time = MomentUtil(new Date().getTime());
    const day = time.format('YYYY-MM-DD');
    const datetime = time.format('YYYY-MM-DD HH:mm:ss');
    let moments: MomentItem[] = [];
    for (const item of MockDailyMoment) {
      if(item.day === day){
        moments = item.moments;
        break;
      }
    }

    if(moments.length === 0){
      MockDailyMoment.unshift({day: day, moments: moments});
    }
    const moment = {datetime: datetime, content: values["content"]};
    moments.unshift(moment);
    onCreated(moment);
    form.setFieldValue("content", "");
  };

  const onDateChange: DatePickerProps['onChange'] = (date, dateString) => {
    console.log(date, dateString);
  };

  const onTimeChange: TimePickerProps['onChange'] = (date, dateString) => {
    console.log(date, dateString);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <Form
      name="MomentForm"
      onFinish={onFinish}
      form={form}
    >
      <Form.Item
        name="content"
        rules={[{ required: true, message: 'Please input your content!' }]}
      >
        <Input.TextArea 
          placeholder="What's happening?" 
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item name="location">
        <Row justify="space-between">
          <Col span={10}>
            <Space>
            <Button icon={<ClockCircleOutlined />} onClick={showModal} />
            <Modal title="事件事件" open={isModalOpen} 
              onOk={handleOk} onCancel={handleCancel} centered={false}>
              <Space>
                <DatePicker onChange={onDateChange} />
                <TimePicker onChange={onTimeChange} />
              </Space>
            </Modal>
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
  const items = moments.map((e) => ({label: e.datetime, children: e.content}));
  return (
    <Timeline
      mode="left"
      items={items}
    />
  );
};


const MomentPage = () => {
  MockDailyMoment.sort((a, b) => (b.day.localeCompare(a.day)));
  const [defaultExpandedRowKeys, setExpandedRowKeys] = useState<readonly Key[]>(
    [MockDailyMoment[0].day],
  );
  const [dayiyMoment, setDailyMoment] = useState<DailyMoment[]>(MockDailyMoment);
  
  const OnCreated = () => {
    console.log("waht happend");
    setDailyMoment([...MockDailyMoment]);
  }

  return (
    <>
    <MomentForm onCreated={OnCreated}></MomentForm>
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
        title: { render: (dom, item) => item.day},
        description: {
          render: (dom, item) => {
            return <div style={{ marginTop: 20 }}><MomentTimeline moments={item.moments} onCreated={OnCreated}></MomentTimeline></div>
             
          },
        },
        content: {
          render: () => {
            return <></>
          },
        },
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