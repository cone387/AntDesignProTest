import { ProList } from '@ant-design/pro-components';
import { Button, Progress, Space } from 'antd';
import { useState } from 'react';
import type { Key } from 'react';
import { Timeline } from 'antd';
import { Form, Input } from 'antd';
import { EnvironmentOutlined, SmileOutlined, SendOutlined } from '@ant-design/icons';
import { Row, Col } from 'antd';
import MomentUtil from 'moment';
import { Store } from 'antd/lib/form/interface';
import React from 'react';
import { Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { To } from 'history';




interface TodoItem{
  // id: number;
  title: string;
  done: boolean;
  content: string;
}


interface CreateFunction {
  (todo: TodoItem): void;
}

const TodoForm = ({onCreated}: {onCreated: CreateFunction}) => {
  const [form] = Form.useForm();
  const onFinish = (values: Store) => {
    console.log('Received values:', values);
    const todo = {
      content: values.content,
      title: values.content,
      done: false
    };
    MockTodoList.unshift(todo);
    onCreated(todo);
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

const MockTodoList = [
  {
    title: "规划好今日待办事项",
    done: false,
    content: "写小说 打游戏"
  }
]

const dataSource = [
  {
    title: '语雀的天空',
    avatar:
      'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
  },
  {
    title: 'Ant Design',
    avatar:
      'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
  },
  {
    title: '蚂蚁金服体验科技',
    avatar:
      'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
  },
  {
    title: 'TechUI',
    avatar:
      'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
  },
];

const onChange = (e: CheckboxChangeEvent) => {
  console.log(`checked = ${e.target.checked}`);
};


const TodoPage: React.FC = () => {
  const [todoList, setTodoList] = useState<TodoItem[]>(MockTodoList);

  const OnCreated = () => {
    setTodoList([...MockTodoList]);
  }
  return (
    <>
      <TodoForm onCreated={ OnCreated }></TodoForm>
      <ProList<TodoItem>
      toolBarRender={() => {
        return [
          <Button key="3" type="primary">
            新建
          </Button>,
        ];
      }}
      metas={{
        title: {},
        description: {
          render: (dom, item) => {
            return item.content;
          },
        },
        avatar: {
          render: () => {
            return <Checkbox onChange={onChange}></Checkbox>;
          }
        },
        extra: {},
        actions: {
          // render: () => {
          //   return [<a key="init">邀请</a>, '发布'];
          // },
        },
      }}
      rowKey="title"
      headerTitle="支持选中的列表"
      // rowSelection={rowSelection}
      dataSource={ todoList }
    />
    </>
  );
};

export default TodoPage;