import { createMoment, requestMoments, requestMomentsGroup } from '@/services/event/moment';
import { uploadToQiNiu, uploadToServer } from '@/services/media/qiniu_clound';
import {
  EnvironmentOutlined,
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  Row,
  Space,
  Tag,
  Timeline,
  Upload,
} from 'antd';
import { Store } from 'antd/lib/form/interface';
import { UploadChangeParam, UploadFile } from 'antd/lib/upload';
import DayJS from 'dayjs';
import MomentUtil from 'moment';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import type { ChangeEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';

function toDailyMoment(moments: Moment.Item[]) {
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
  (moment: Moment.Item): void;
}

const now = MomentUtil(new Date().getTime());

const EditingMomentItem: Moment.FormItem & {
  mediaList: UploadFile<Media.Item>[];
  reset: () => void;
} = {
  content: '',
  event_time: now.format('YYYY-MM-DD HH:mm:ss'),
  post_medias: [],
  extra: {},
  feeling: null,
  post_tags: null,
  mediaList: [],

  reset() {
    this.content = '';
    this.tags = '';
    this.feeling = null;
    this.post_medias = [];
    this.extra = {};
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
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const onFinish = (values: Store) => {
    const content = values['content'].replace(/#[^\s#]+/g, '').trimStart();
    const moment = { ...EditingMomentItem, content: content };

    createMoment(moment).then((created) => {
      form.setFieldValue('content', '');
      setTags([]);
      setUploadFiles([]);
      EditingMomentItem.reset();
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
    EditingMomentItem.post_tags = extractedTags.map((e) => e.slice(1)).join(',');
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
    setUploadFiles(info.fileList);
  };

  const customRequest = (options: UploadRequestOption<Media.Item>) => {
    console.log('customRequest: ', options);
    const file = options.file as File;
    uploadToQiNiu(
      { file: file, model: 'Moment' },
      {
        complete: (response) => {
          console.log('complete: ', response);
          uploadToServer({ model: 'Moment', key: response.key, size: file.size }).then(
            (response) => {
              console.log('uploadToServer: ', response);
              EditingMomentItem.post_medias.push(response.id);
              // EditingMomentItem.mediaList.push();
              options.onSuccess?.(response);
            },
          );
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
      <Form.Item
        style={{ padding: 0, margin: 0 }}
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
      {/*  'picture' | 'picture-card' | 'picture-circle' */}
      <Upload
        listType="picture-card"
        ref={uploadRef}
        maxCount={10}
        onChange={onChange}
        defaultFileList={[]}
        fileList={uploadFiles}
        style={{ padding: 0, margin: 0 }}
        onPreview={(file: UploadFile<Media.Item>) => {
          window.open(file.response?.uri, 'image_preview', 'noopener');
        }}
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

const MomentTimeline = ({ moments }: { moments: Moment.Item[]; onCreated: CreateFunction }) => {
  const items = moments.map((e) => ({
    label: e.event_time.split(' ')[1].slice(0, 5),
    children: e.content,
  }));
  return <Timeline mode="left" items={items} />;
};

const DayMomentList = ({ moments }: { moments: Moment.Item[] }) => {
  return (
    <ProList<Moment.Item>
      rowKey="id"
      dataSource={moments}
      // showActions="hover"
      // editable={{
      //   onSave: async (key, record, originRow) => {
      //     console.log(key, record, originRow);
      //     return true;
      //   },
      // }}
      // onDataSourceChange={setDataSource}
      metas={{
        title: {
          dataIndex: 'content',
        },
        avatar: {
          // dataIndex: 'feeling',
          editable: false,
          render: (dom, entity) => {
            return entity.feeling?.emoji;
          },
        },
        description: {
          dataIndex: 'desc',
          render: (dom, entity) => {
            let media;
            console.log(entity.medias);
            if (entity.medias) {
              media = entity.medias.map((media) => (
                <Image key={media.id} src={media.uri} width={100} height={100} />
              ));
            }
            return (
              <>
                <Space>{media}</Space>

                <Row justify="space-between">
                  <Col span={10}>
                    <Space>
                      <span>{entity.event_time.split(' ')[1].slice(0, 5)}</span>
                    </Space>
                  </Col>
                  <Col>
                    {entity.tags.map((tag) => (
                      <Tag key={tag.id} color={tag.color ?? '#5BD8A6'}>
                        {tag.name}
                      </Tag>
                    ))}
                  </Col>
                </Row>
              </>
            );
          },
        },
        // subTitle: {
        //   render: () => {
        //     return (
        //       <Space size={0}>
        //         <Tag color="blue">Ant Design</Tag>
        //         <Tag color="#5BD8A6">TechUI</Tag>
        //       </Space>
        //     );
        //   },
        // },
      }}
    />
  );
};

const MomentPage = () => {
  const [moments, setMoments] = useState<Moment.Item[]>([]);
  const [momentGroup, setMomentGroup] = useState<Moment.Group>({});
  const [queryParams] = useState<Moment.QueryParams>({ page: 1, page_size: 10 });
  const [totalNum, setTotalNum] = useState<number>(0);

  const OnMomentCreated = (moment: Moment.Item) => {
    setMoments([moment, ...moments]);
  };

  const refreshMoments = async () => {
    const response = await requestMoments(queryParams);
    setMoments(response.results);
    setTotalNum(response.count);
  };

  useEffect(() => {
    requestMomentsGroup().then((momentGroup) => {
      setMomentGroup(momentGroup);
      refreshMoments();
    });
  }, []);

  const monthSelectValueEnum: Json = {};
  for (const group of momentGroup.month ?? []) {
    monthSelectValueEnum[group.month] = group.month;
  }
  const feelingSelectValue: Json = {};
  for (const feeling of momentGroup.feeling ?? []) {
    feelingSelectValue[feeling.feeling__emoji] = feeling.feeling__emoji;
  }
  const tagSelectValue: Json = {};
  for (const tag of momentGroup.tag ?? []) {
    tagSelectValue[tag.tags__name] = tag.tags__name;
  }
  const listRef = useRef();
  const formRef = useRef();

  return (
    <>
      <MomentForm onCreated={OnMomentCreated}></MomentForm>
      <ProList<Moment.Item>
        actionRef={listRef}
        rowKey="event_time"
        formRef={formRef}
        search={{
          filterType: 'query',
          collapsed: false,
          span: 4,
          split: false,
          labelWidth: 'auto',
        }}
        // request={async (params = {}) => {
        //   queryParams.page = params.current;
        //   queryParams.page_size = params.pageSize;
        //   queryParams.tag = params['tags'];
        //   queryParams.month = params['month'];
        //   queryParams.content__contains = params['content'];
        //   queryParams.feeling__emoji = params['avatar'];
        //   const response = await requestMoments(queryParams);
        //   return Promise.resolve({
        //     data: response.results,
        //     success: true,
        //     total: response.count,
        //   });
        //   // .then((response) => {
        //   //     setMoments(response.results);
        //   //     setTotalNum(response.count)
        //   //   });
        // }}
        pagination={{
          defaultPageSize: queryParams.page,
          showSizeChanger: true,
          pageSize: queryParams.page_size,
          total: totalNum,
          onChange(page, pageSize) {
            console.log('page:', page, pageSize);
            queryParams.page = page;
            queryParams.page_size = pageSize;
            refreshMoments();
            // requestMoments(queryParams).then((response) => {
            //   setQueryParams(queryParams);
            //   setMoments(response.results);
            // });
          },
        }}
        onSubmit={(params) => {
          console.log('params:', params);
          queryParams.tag = params['tags'];
          queryParams.month = params['month'];
          queryParams.content__contains = params['content'];
          queryParams.feeling__emoji = params['avatar'];
          queryParams.page = 1;
          refreshMoments();
        }}
        dataSource={moments}
        metas={{
          month: {
            title: '年月',
            valueType: 'select',
            valueEnum: monthSelectValueEnum,
          },
          title: {
            dataIndex: 'content',
            valueType: 'text',
            title: '内容',
          },
          avatar: {
            // dataIndex: 'feeling',
            editable: false,
            render: (dom, entity) => {
              return entity.feeling?.emoji;
            },
            title: 'feeling',
            valueType: 'select',
            valueEnum: feelingSelectValue,
          },
          tags: {
            title: '标签',
            valueType: 'select',
            valueEnum: tagSelectValue,
          },

          description: {
            dataIndex: 'desc',
            search: false,
            render: (dom, entity) => {
              let media;
              if (entity.medias) {
                media = entity.medias.map((media) => (
                  <Image key={media.id} src={media.uri} width={100} height={100} />
                ));
              }
              return (
                <>
                  <Space>{media}</Space>

                  <Row justify="space-between">
                    <Col span={10}>
                      <Space>
                        <span>{entity.event_time.split(' ')[1].slice(0, 5)}</span>
                      </Space>
                    </Col>
                    <Col>
                      {entity.tags.map((tag) => (
                        <Tag key={tag.id} color={tag.color ?? '#5BD8A6'}>
                          {tag.name}
                        </Tag>
                      ))}
                    </Col>
                  </Row>
                </>
              );
            },
          },
        }}
      ></ProList>
    </>
  );
};

// const MomentPage = () => {
//   // Moments.sort((a, b) => (b.date.localeCompare(a.date)));
//   const [moments, setMoments] = useState<Moment.Item[]>([]);
//   const [expandedRowKeys, setExpandedRowKeys] = useState<readonly Key[]>([]);
//   // const [month] = useState<string>(DayJS().format('YYYY-MM'));
//   const [momentGroup, setMomentGroup] = useState<Moment.Group>({});

//   const dayiyMoment: Moment.DailyMoment[] = toDailyMoment(moments);

//   const OnMomentCreated = (moment: Moment.Item) => {
//     setMoments([moment, ...moments]);
//   };

//   function requestGroupMoments(month?: string) {
//     requestMoments({ month: month }).then((response) => {
//       setMoments(response.results);
//       if (response.results.length > 0) {
//         setExpandedRowKeys([response.results[0].event_time.split(' ')[0]]);
//       }
//     });
//   }

//   useEffect(() => {
//     requestMomentsGroup().then((momentGroup) => {
//       setMomentGroup(momentGroup);
//       requestGroupMoments(momentGroup.month?.[0]?.month);
//     });
//   }, []);

//   function onMonthChanged(month: DayJS.Dayjs | null) {
//     requestGroupMoments(month?.format('YYYY-MM'));
//   }

//   function disabledDate(current: DayJS.Dayjs) {
//     // Can not select days before today and today
//     // return current && current > DayJS().endOf('day');
//     for (const group of momentGroup.month ?? []) {
//       if (group.month === current.format('YYYY-MM')) {
//         return false;
//       }
//     }
//     return true;
//   }
//   return (
//     <>
//       <MomentForm onCreated={OnMomentCreated}></MomentForm>
//       <Space>
//         <DatePicker
//           onChange={onMonthChanged}
//           picker="month"
//           disabledDate={disabledDate}
//           format={'YYYY年MM月'}
//         />
//       </Space>
//       <ProList<Moment.DailyMoment>
//         rowKey="date"
//         // headerTitle="支持展开的列表"
//         // actionRef={}
//         // search={{}}
//         // pagination={{
//         //   defaultPageSize: 5,
//         //   showSizeChanger: true,
//         //   pageSize: 5,
//         //   total: moments.length,
//         //   onChange(page, pageSize) {
//         //     console.log("page", page, pageSize)
//         //   },
//         // }}
//         expandable={{
//           onExpandedRowsChange: setExpandedRowKeys,
//           // expandRowByClick: true,
//           expandedRowKeys: expandedRowKeys,
//         }}
//         dataSource={dayiyMoment}
//         metas={{
//           title: { render: (dom, item) => item.date, dataIndex: 'date', title: '日期' },
//           description: {
//             render: (dom, item) => {
//               return (
//                 <div style={{ marginTop: 20 }}>
//                   <DayMomentList moments={item.moments}></DayMomentList>
//                   {/* <MomentTimeline
//                     moments={item.moments}
//                     onCreated={OnMomentCreated}
//                   ></MomentTimeline> */}
//                 </div>
//               );
//             },
//           },
//           // avatar: {},
//           content: {},
//           actions: {},
//           subTitle: {
//             render: (dom, item) => {
//               return (
//                 <Space size={0}>
//                   <Tag color="blue">{item.moments.length} moments</Tag>
//                 </Space>
//               );
//             },
//           },
//         }}
//       />
//     </>
//   );
// };

export default MomentPage;
