import { Fragment, useState, useEffect, useRef } from "react";
import {
  Flex,
  Typography,
  Input,
  Button,
  Skeleton,
  Descriptions,
  Dropdown,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./chat.module.css";

const { Paragraph } = Typography;
const { TextArea } = Input;

export default function Chat() {
  const [fetchingAIResponse, setFetchingAIResponse] = useState(false);
  const [query, setQuery] = useState();
  const [documentCollection, setDocumentCollection] = useState();
  const [fileCollection, setFileCollection] = useState();
  const [messages, setMessages] = useState([]);
  const [promptLibrary, setPromptLibrary] = useState({ items: [] });

  const latestMessageRef = useRef(null);
  const textareaRef = useRef(null);

  const handleQuery = async () => {
    if (!documentCollection || !fileCollection?.length || !query.trim()) return;
    setFetchingAIResponse(true);

    const new_messages = [
      {
        query: query,
        response: "",
      },
    ];
    setMessages((prev) => [...prev, ...new_messages]);

    const query_json = {
      query: query,
      uuid_list: fileCollection,
    };

    setQuery("");

    const response = await apiService.postInquireDocuments(
      documentCollection,
      query_json
    );

    setMessages((prev) =>
      prev.map((msg, index) =>
        index === prev.length - 1 ? { ...msg, response: response.answer } : msg
      )
    );

    setFetchingAIResponse(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  useEffect(() => {
    // docSub
    const docSub = statusService
      .getStatus$("documentCollection")
      .subscribe((_documentCollection) => {
        setDocumentCollection(_documentCollection);
        setQuery("");

        const collections = statusService.getSnapshot("collections") || [];
        const collection = collections.find(
          (c) => c.collection_name === _documentCollection
        );

        if (!collection || !collection.prompts) {
          setPromptLibrary({ items: [] });
          return;
        }

        const promptItems = Object.entries(collection.prompts).map(
          ([key, value]) => ({
            key: value,
            label: key,
          })
        );

        const promptLibrary = {
          items: promptItems,
          onClick: ({ key }) => {
            const selected = promptItems.find((item) => item.key === key);
            if (selected) {
              setQuery(key);
              textareaRef.current?.focus();
            }
          },
        };

        setPromptLibrary(promptLibrary);
      });

    // fileSub
    const fileSub = statusService
      .getStatus$("fileCollection")
      .subscribe((_fileCollection) => {
        const finalFileCollection = [
          ...new Set(_fileCollection.map((f) => f.split("_").pop())),
        ];
        setFileCollection(finalFileCollection);
      });

    // topNsimilarityDocumentsSub
    const topNsimilarityDocumentsSub = statusService
      .getStatus$("topNsimilarityDocuments")
      .subscribe((_topNsimilarityDocuments) => {
        const labelStyle = { width: "8rem" };
        if (_topNsimilarityDocuments.length > 0) {
          const new_messages = [
            {
              query: "",
              response: "",
              similarityInfo: _topNsimilarityDocuments.map((datum) => {
                return [
                  {
                    label: "File Path",
                    children: datum.file_path,
                    labelStyle: labelStyle,
                  },
                  {
                    label: "Similarity",
                    children: datum.similarity,
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                  {
                    label: "Tags",
                    children: datum.tags.join(", "),
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                  {
                    label: "Summary",
                    children: datum.summary,
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                ];
              }),
            },
          ];
          setMessages((prev) => [...prev, ...new_messages]);
        }
      });

    return () => {
      docSub.unsubscribe();
      fileSub.unsubscribe();
      topNsimilarityDocumentsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({
        behavior: "smooth",
      });
      latestMessageRef.current = null;
    }
  }, [messages]);

  return (
    <>
      <Flex
        justify="flest-start"
        align="center"
        className={styles.chat_con}
        vertical
      >
        {messages.map((message, index) => {
          const last = index === messages.length - 1;
          return (
            <Fragment key={index}>
              <Flex
                ref={last ? latestMessageRef : null}
                className={styles.thread_con}
                style={{
                  height: last ? "100%" : "auto",
                  flex: last ? "0 0  auto" : "1",
                }}
                vertical
              >
                {message.query && (
                  <Typography className={styles.user_thread_con}>
                    <Paragraph>
                      <pre>{message.query}</pre>
                    </Paragraph>
                  </Typography>
                )}
                {(fetchingAIResponse || message.response) && (
                  <Typography
                    style={{
                      paddingBottom: last ? "10rem" : 0,
                    }}
                  >
                    <Skeleton
                      avatar
                      active
                      paragraph={{ rows: 4 }}
                      loading={fetchingAIResponse && last}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.response}
                      </ReactMarkdown>
                    </Skeleton>
                  </Typography>
                )}
                {message.similarityInfo && (
                  <Typography
                    style={{
                      paddingBottom: last ? "10rem" : 0,
                    }}
                  >
                    <Skeleton
                      avatar
                      active
                      paragraph={{ rows: 4 }}
                      loading={fetchingAIResponse && last}
                    >
                      {message.similarityInfo.map(
                        (messageSimilarityInfo, index) => {
                          return (
                            <Descriptions
                              key={index}
                              bordered
                              style={{ marginTop: "1rem" }}
                              items={messageSimilarityInfo}
                            />
                          );
                        }
                      )}
                    </Skeleton>
                  </Typography>
                )}
              </Flex>
            </Fragment>
          );
        })}

        {/* query box */}
        <Flex justify="center" className={styles.queryBox_con}>
          <Flex className={styles.textarea_con} vertical>
            <TextArea
              ref={textareaRef}
              value={query}
              variant="borderless"
              placeholder="send a message..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setQuery(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 10 }}
            />
            <Flex justify="space-between">
              <Dropdown
                autoFocus
                arrow
                menu={promptLibrary}
                trigger={["click"]}
                placement="bottomLeft"
              >
                <Button>Prompt Library</Button>
              </Dropdown>
              <Button
                type="primary"
                disabled={!documentCollection || !fileCollection?.length}
                loading={fetchingAIResponse}
                icon={<SendOutlined rotate={270} onClick={handleQuery} />}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
