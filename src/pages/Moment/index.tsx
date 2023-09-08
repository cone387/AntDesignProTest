import { ProList } from '@ant-design/pro-components';
import { Button, Space, Tag } from 'antd';
import type { Key } from 'react';
import { useState } from 'react';
import { Timeline } from 'antd';
import { Form, Input } from 'antd';
import { EnvironmentOutlined, SmileOutlined, SendOutlined } from '@ant-design/icons';
import { Row, Col } from 'antd';
import MomentUtil from 'moment';
import { Store } from 'antd/lib/form/interface';



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
  const [mode] = useState<'left' | 'alternate' | 'right'>('left');
  const items = moments.map((e) => ({label: e.datetime, children: e.content}));
  return (
    <Timeline
      mode={mode}
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
    <ProList<{ day: string, moments: MomentItem[]}>
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