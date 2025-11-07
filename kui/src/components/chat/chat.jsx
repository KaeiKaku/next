/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { Fragment, useState, useEffect, useRef } from "react";
import {
  Flex,
  Typography,
  Input,
  Button,
  Skeleton,
  Descriptions,
  Dropdown,
  Tag,
  message,
} from "antd";
import { SendOutlined, FileTextOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";
import useSessionModal from "@/hook/useSessionModal";
import SessionModal from "@/components/SessionModal/sessionModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./Chat.module.css";

const { Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Chat コンポーネント
 *
 * @returns {JSX.Element} The rendered Chat component.
 */
export default function Chat() {
  const [showIntro, confirmIntro] = useSessionModal("hasSeenIntro");
  const [fetchingAIResponse, setFetchingAIResponse] = useState(false);
  const [query, setQuery] = useState();
  const [documentCollection, setDocumentCollection] = useState();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [messages, setMessages] = useState([]);
  const [promptLibrary, setPromptLibrary] = useState({ items: [] });
  const [messageApi, messageContextHolder] = message.useMessage();

  const latestMessageRef = useRef(null);
  const textareaRef = useRef(null);

  const handleQuery = async () => {
    if (!documentCollection || !selectedKeys?.length || !query.trim()) return;

    setFetchingAIResponse(true);
    try {
      const new_messages = [
        {
          query: query,
          response: "",
          uuid_list: selectedKeys,
        },
      ];
      setMessages((prev) => [...prev, ...new_messages]);

      const query_json = {
        query: query,
        uuid_list: selectedKeys,
      };

      setQuery("");

      const response = await apiService.postInquireDocuments(
        documentCollection,
        query_json
      );

      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, response: response.answer }
            : msg
        )
      );
    } catch (error) {
      messageApi.open({
        type: "error",
        content: `Error in chat query: ${error}`,
      });
    } finally {
      setFetchingAIResponse(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  /**
   * 指定された UUID に対応するドキュメントのファイル名を取得します。
   *
   * @param {string} uuid - 取得対象のドキュメントの UUID。
   * @returns {string} ファイル名。該当ドキュメントが存在しない場合、またはパスが無効な場合は空文字列を返します。
   */
  const getDocumentFilenameUUID = (uuid) => {
    const documents = statusService.getSnapshot("documents");
    const doc = documents.find((d) => d.uuid === uuid);
    return doc ? (doc.file_path.split(/[/\\]/).pop() ?? "") : "";
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
      .getStatus$("selectedKeys")
      .subscribe((_selectedKeys) => {
        const finalFileCollection = [
          ...new Set(_selectedKeys.map((f) => f.split("_").pop())),
        ];
        setSelectedKeys(finalFileCollection);
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
    if (showIntro) {
      const new_messages = [
        {
          query: "",
          response: "",
          similarityInfo: "",
          isShowIntro: true,
        },
      ];
      setMessages((prev) => [...prev, ...new_messages]);
    }
  }, [showIntro]);

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
      {messageContextHolder}
      <SessionModal visible={showIntro} onConfirm={confirmIntro}></SessionModal>
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
                      <Flex gap=".5rem 0" wrap>
                        {message.uuid_list?.map((uuid, index) => {
                          return (
                            <Tag
                              key={index}
                              icon={<FileTextOutlined />}
                              color="orange"
                            >
                              {getDocumentFilenameUUID(uuid)}
                            </Tag>
                          );
                        })}
                      </Flex>
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
                {message.isShowIntro && (
                  <Typography
                    style={{
                      paddingBottom: last ? "10rem" : 0,
                    }}
                  >
                    <Flex
                      style={{
                        padding: "1rem",
                      }}
                    >
                      <ul>
                        <li>
                          生成AIはプロンプトの入れ方により、表示される回答の精度が異なります。単語のみではなく、文章を入力してください。
                          <p>例：×「EY新日本」</p>
                          <p>〇「EY新日本を紹介してください。」</p>
                        </li>
                        <li>
                          当サービスは、以下の関連のドキュメントに対して、
                          <b>Azure OpenAI</b>
                          を利用した自動応答を提供するサービス（開発版）です。あらかじめ用意されたドキュメントに対して質問を投げかけ、回答を得ることができます。複数のドキュメントを横断的に検索し、情報を整理することも可能です。
                        </li>
                        <li>
                          <b
                            style={{
                              color: "red",
                            }}
                          >
                            クライアントの機密情報や個人情報などの入力は禁止します。
                          </b>
                        </li>
                        <li>
                          回答には正確性に欠ける場合があるため、回答を疑問視し、内容を慎重に検討した上で、自己判断に基づいてご利用ください。
                        </li>
                        <li>
                          入力された内容は機能向上のためにログを取得します。
                        </li>
                        <li style={{ marginTop: "1rem" }}>
                          <b>ご利用流れ</b>
                        </li>
                        <ul
                          style={{
                            paddingLeft: "1rem",
                          }}
                        >
                          <li>左のDocument Collectionを選択</li>
                          <li>
                            Selection
                            Queryを検索すると対象Collectionのファイル類似度を計算されます
                          </li>
                          <li>
                            Similarityやフォルダツリーに適当なファイルを選択
                          </li>
                          <li>下の会話枠に質問を投げてAIが答えてくれます</li>
                        </ul>
                      </ul>
                    </Flex>
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
                disabled={!documentCollection || !selectedKeys?.length}
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
