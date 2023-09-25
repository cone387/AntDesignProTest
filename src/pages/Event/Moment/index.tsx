import {
  createMoment,
  deleteMoments,
  requestMoments,
  requestMomentsGroup,
} from '@/services/event/moment';
import { uploadToQiNiu, uploadToServer } from '@/services/media/qiniu_clound';
import {
  ChromeFilled,
  EnvironmentOutlined,
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import { Button, Col, DatePicker, Form, Image, Input, Modal, Row, Space, Tag, Upload } from 'antd';
import { Store } from 'antd/lib/form/interface';
import { UploadChangeParam, UploadFile } from 'antd/lib/upload';
import DayJS from 'dayjs';
import MomentUtil from 'moment';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import type { ChangeEventHandler, Key } from 'react';
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
  post_feeling: null,
  post_tags: null,
  mediaList: [],

  reset() {
    this.content = '';
    this.tags = '';
    this.feeling = null;
    this.post_medias = [];
    // this.extra = {};
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

const BrowseIconMap: { [key: string]: React.ReactElement } = {
  chrome: <ChromeFilled color="#FFFFFF" />,
  // safari: 'safari',
  // firefox: 'firefox',
  // edge: 'edge',
  // ie: 'ie',
  // opera: 'opera',
};

function extractBrowser(userAgent?: string | null): React.ReactElement | null {
  if (!userAgent) {
    return null;
  }
  const pattern = /(chrome|safari|firefox|edge|ie|opera)/i;
  const match = userAgent.match(pattern);
  if (match) {
    return BrowseIconMap[match[0].toLowerCase()];
  } else {
    return null;
  }
}

const FeelingPicker = ({
  defaultValue,
  avaliableFeelings,
}: {
  defaultValue?: string | null;
  avaliableFeelings: Moment.FeelingGroup[];
}) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [feeling, setFeeling] = useState<string | undefined | null>(defaultValue);
  const onChange = (feelingGroup?: Moment.FeelingGroup) => {
    console.log('feeling: ', feelingGroup);
    setModalOpen(false);
    EditingMomentItem.post_feeling = feelingGroup?.id;
    setFeeling(feelingGroup?.emoji);
  };
  const emojis = [];
  const cols = 9;
  for (let i = 0; i < avaliableFeelings?.length; i += cols) {
    emojis.push(avaliableFeelings.slice(i, i + cols));
  }
  return (
    <>
      <Button
        title="情绪"
        style={{ paddingInline: 1, paddingTop: 0, paddingBottom: 0, fontSize: 20 }}
        icon={feeling ? undefined : <SmileOutlined style={{ fontSize: 20 }} />}
        onClick={() => setModalOpen(!isModalOpen)}
      >
        {feeling}
      </Button>
      <Modal
        width={9 * 40}
        bodyStyle={{ paddingTop: 20 }}
        open={isModalOpen}
        footer={false}
        onCancel={() => {
          setModalOpen(false);
        }}
      >
        {emojis.map((row, index) => {
          return (
            <Space key={index}>
              {row.map((item) => {
                if (item.id === 0) {
                  return (
                    <span key={item.id}>
                      <SmileOutlined
                        key={item.id}
                        style={{
                          paddingTop: 5,
                          marginLeft: 7,
                          fontSize: 20,
                        }}
                        onClick={() => onChange(item)}
                      />
                    </span>
                  );
                }
                return (
                  <span
                    title={item.name}
                    key={item.id}
                    style={{ fontSize: 20 }}
                    onClick={() => onChange(item)}
                  >
                    {item.emoji}
                  </span>
                );
              })}
            </Space>
          );
        })}
      </Modal>
    </>
  );
};

const MomentForm = ({
  onCreated,
  feelings,
}: {
  onCreated: CreateFunction;
  feelings: Moment.FeelingGroup[];
}) => {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [enableLocation, setEnableLocation] = useState<boolean>(true);

  function onLocationChanged(enable: boolean) {
    if (enable) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log('position: ', position);
        EditingMomentItem.extra = {
          ...EditingMomentItem.extra,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        };
        setEnableLocation(enable);
      });
    } else {
      EditingMomentItem.extra = {
        ...EditingMomentItem.extra,
        location: null,
      };
      setEnableLocation(enable);
    }
  }

  useEffect(() => {
    onLocationChanged(enableLocation);
  }, [enableLocation]);

  const onFinish = async (values: Store) => {
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

  let locationTitle = '记录位置';
  if (enableLocation && EditingMomentItem.extra?.location) {
    locationTitle = `经度: ${EditingMomentItem.extra.location.latitude}\n纬度: ${EditingMomentItem.extra.location.longitude}`;
  }

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
              <Button
                type={enableLocation ? 'primary' : 'default'}
                icon={<EnvironmentOutlined />}
                onClick={() => {
                  onLocationChanged(!enableLocation);
                }}
                title={locationTitle}
              />
              {/* <Button icon={<SmileOutlined />} /> */}
              <FeelingPicker avaliableFeelings={feelings}></FeelingPicker>
              <Button
                icon={<PictureOutlined style={{ fontSize: 20 }} />}
                onClick={onUploadClick}
              ></Button>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              disabled={false}
            ></Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};

const MomentPage = () => {
  const [moments, setMoments] = useState<Moment.Item[]>([]);
  const [momentGroup, setMomentGroup] = useState<Moment.Group>({});
  const [queryParams] = useState<Moment.QueryParams>({ page: 1, page_size: 10 });
  const [totalNum, setTotalNum] = useState<number>(0);
  const [selectable, setSelectable] = useState<boolean>(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

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
    if (feeling.count > 0) {
      feelingSelectValue[feeling.emoji] =
        feeling.id === 0 ? '空' : `${feeling.emoji}(${feeling.name})`;
    }
  }
  const tagSelectValue: Json = {};
  for (const tag of momentGroup.tag ?? []) {
    tagSelectValue[tag.tags__name] = tag.tags__name;
  }

  return (
    <>
      <MomentForm onCreated={OnMomentCreated} feelings={momentGroup.feeling ?? []}></MomentForm>
      <ProList<Moment.Item>
        rowKey="id"
        // split={true}
        // options={{}}
        toolBarRender={(action, rows) => {
          if (selectable) {
            return [
              <Button
                key={'select_all'}
                onClick={() => {
                  setSelectedRowKeys(moments.map((e) => e.id));
                }}
              >
                全选
              </Button>,
              <Button
                danger
                type="primary"
                onClick={() => {
                  deleteMoments(rows.selectedRowKeys);
                }}
                key={'delete'}
                disabled={(rows.selectedRowKeys?.length ?? 0) === 0}
              >
                删除
              </Button>,
            ];
          }
          return [];
        }}
        search={{
          filterType: 'query',
          collapsed: false,
          span: 4,
          split: false,
          labelWidth: 'auto',
          optionRender: (searchConfig, props, dom) => {
            const a = (
              <Button
                key={'manage'}
                onClick={() => {
                  setSelectable(!selectable);
                }}
              >
                管理
              </Button>
            );
            return [a, ...dom];
          },
        }}
        rowSelection={
          selectable
            ? {
                selectedRowKeys,
                hideSelectAll: false,
                alwaysShowAlert: false,
                selections: [
                  {
                    key: 'Select All',
                    onSelect: (keys) => {
                      console.log('dosnad', keys);
                    },
                    text: 'hello',
                  },
                ],
                columnTitle: (
                  <>
                    <span>what happen</span>
                  </>
                ),
                onChange: (keys: Key[]) => {
                  setSelectedRowKeys(keys);
                },
              }
            : false
        }
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
        // toolbar={{actions: [
        //   <Button key="primary">新建</Button>
        // ]}}
        onSubmit={(params) => {
          console.log('params:', params);
          queryParams.tag = params['tags'];
          queryParams.month = params['month'];
          queryParams.content__contains = params['title'];
          queryParams.feeling__emoji = params['avatar'];
          queryParams.page = 1;
          refreshMoments();
        }}
        dataSource={moments}
        itemTitleRender={(item) => {
          let location = item.extra.location;
          let device = extractBrowser(item.extra.device?.ua);

          if (device) {
            device = <span title={item.extra.device?.ip}>{device}</span>;
          }
          let info = device;
          if (location) {
            info = (
              <Space>
                <EnvironmentOutlined
                  title={`经度: ${location.latitude}\n纬度: ${location.longitude}`}
                />
                {device}
              </Space>
            );
          }
          return (
            <Row justify="space-between">
              <Col>
                <Space>
                  <p>{item.content}</p>
                </Space>
              </Col>
              <Col>{info}</Col>
            </Row>
          );
        }}
        metas={{
          month: {
            title: '年月',
            valueType: 'select',
            valueEnum: monthSelectValueEnum,
          },
          title: {
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
                    <Col>
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
          //   render: (dom, entity) => {
          //     let location = entity.extra.location;
          //     let device = extractBrowser(entity.extra.device?.ua);
          //     if(device){
          //       device = <span title={entity.extra.device?.ip}>{device}</span>
          //     }
          //     if(location){
          //       return <Space>
          //         <EnvironmentOutlined title={`经度: ${location.latitude}\n纬度: ${location.longitude}`} />
          //         {device}
          //       </Space>
          //     }
          //     return device;
          //   }
          // }
        }}
      ></ProList>
    </>
  );
};

export default MomentPage;
