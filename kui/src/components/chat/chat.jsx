/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { Fragment, useState, useEffect, useRef, memo } from "react";
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
  Checkbox,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { statusService } from "@/common/status";
import { apiService } from "@/service/api.service";
import useSessionModal from "@/hooks/useSessionModal";
import SessionModal from "@/components/SessionModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getFileNameFromFilePath } from "@/common/utility";
import { extractUuidFromKey } from "@/common/common";
import style from "./Chat.module.css";

/**
 * 四角の中に数字を描画する SVG コンポーネント
 *
 * props:
 *  - number: 表示する数値（string|number）
 */
const NumberIcon = memo(({ number, size = 16 }) => {
  const n = String(number);
  const w = size;
  const h = size;
  const fontSize = Math.round(size * 0.55);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`document-${n}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <defs>
        <linearGradient id="g-light" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f5f6f7" />
          <stop offset="100%" stopColor="#d9dbe0" />
        </linearGradient>
        <linearGradient id="g-shadow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="emboss" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset in="SourceAlpha" dx="0" dy="1" result="off" />
          <feGaussianBlur in="off" stdDeviation="0.6" result="blur" />
          <feComposite
            in="blur"
            in2="SourceAlpha"
            operator="out"
            result="shadow"
          />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 背景の角丸四角（グラデーション） */}
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        rx={Math.max(2, Math.floor(size * 0.15))}
        ry={Math.max(2, Math.floor(size * 0.15))}
        fill="url(#g-light)"
        stroke="#bfc3ca"
        filter="url(#emboss)"
      />
      {/* 補助的なハイライトで立体感 */}
      <rect
        x="1"
        y="1"
        width={w - 2}
        height={(h - 2) / 2}
        rx={Math.max(2, Math.floor(size * 0.15))}
        ry={Math.max(2, Math.floor(size * 0.15))}
        fill="url(#g-shadow)"
        opacity="0.18"
      />
      {/* 数字 */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="600"
        fontSize={fontSize}
        fill="#2f3542"
      >
        {n}
      </text>
    </svg>
  );
});

/**
 * Chat コンポーネント
 *
 * @returns {JSX.Element} The rendered Chat component.
 */
export default function Chat() {
  const [isIntroVisible, confirmIntro] = useSessionModal("hasSeenIntro");
  const [isFetchingAnswer, setIsFetchingAnswer] = useState(false);
  const [userQuery, setUserQuery] = useState();
  const [selectedCollectionName, setSelectedCollectionName] = useState();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [promptLibrary, setPromptLibrary] = useState({ items: [] });
  const [messageApi, messageContextHolder] = message.useMessage();

  const latestMessageRef = useRef(null);
  const textareaRef = useRef(null);

  /**
   * メッセージの一意なIDを生成する関数
   *
   * 日時とランダム文字列を組み合わせて、一意なメッセージIDを作成する
   * フォーマット: YYYYMMDD-HHMMSS.sss-xxxxxxxx
   *
   * @returns {string} 生成されたメッセージID
   * @example
   * // 例: "20231215-143022.456-a7b9c2d1"
   * const messageId = createMessageId();
   */
  const createMessageId = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const sss = String(d.getMilliseconds()).padStart(3, "0");

    let randomString;
    try {
      // Use browser crypto if available for stronger randomness
      const arr = window.crypto.getRandomValues(new Uint32Array(2));
      const big = (BigInt(arr[0]) << 32n) | BigInt(arr[1]);
      randomString = big.toString(36).padStart(8, "0").slice(-8);
    } catch {
      // Fallback to Math.random
      randomString = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
    }

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}.${sss}-${randomString}`;
  };

  /**
   * 指定されたUUIDの選択状態を切り替える
   *
   * 現在の選択済みキーリストから指定されたUUIDが存在するかチェックし、
   * 存在する場合は削除、存在しない場合は追加してステータスを更新する
   *
   * @param {string} uuid - 選択状態を切り替えるアイテムのUUID
   */
  const toggleSelection = (uuid) => {
    const current = statusService.getSnapshot("@SelectedKeys") || [];
    const exists = current.some((k) => extractUuidFromKey(k) === uuid);
    let newKeys;
    if (exists) {
      newKeys = current.filter((k) => extractUuidFromKey(k) !== uuid);
    } else {
      newKeys = [...current, uuid];
    }
    statusService.patchStatus("@SelectedKeys", newKeys);
  };

  /**
   * チャットクエリを処理する際のハンドラ
   *
   * ユーザーのクエリを送信し、応答を取得してチャットメッセージを更新する
   *
   * @async
   * @returns {Promise<void>} 処理完了を示すPromise
   * @throws {Error} API呼び出しまたはメッセージ更新時のエラー
   */
  const handleQuery = async () => {
    if (!selectedCollectionName || !selectedKeys?.length || !userQuery.trim()) {
      return;
    }

    setIsFetchingAnswer(true);
    try {
      const messageId = createMessageId();
      const outgoingMessage = [
        {
          id: messageId,
          type: "query_response",
          query: userQuery,
          uuid_list: selectedKeys,
          response: "", // 応答がくるまでのプレースホルダー
        },
      ];
      setChatMessages((prevMessages) => [...prevMessages, ...outgoingMessage]);

      // クエリを送信し、応答を取得したら、入力クエリをクリアする
      const queryPayload = {
        query: userQuery,
        uuid_list: selectedKeys,
      };
      const response = await apiService.postInquireDocuments(
        selectedCollectionName,
        queryPayload
      );
      setUserQuery("");

      // メッセージIDに基づいて、回答内容を更新する
      setChatMessages((messages) =>
        messages.map((message) =>
          message.id === messageId
            ? { ...message, response: response?.answer ?? "" }
            : message
        )
      );
    } catch (error) {
      messageApi.open({
        type: "error",
        content: `Error in chat query: ${error}`,
      });
    } finally {
      setIsFetchingAnswer(false);
    }
  };

  /**
   * キーボードイベントを処理するハンドラ
   *
   * Shift キーが押されていない状態で Enterキーが押された場合にクエリを処理する
   *
   * @param {KeyboardEvent} e - キーボードイベントオブジェクト
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  /**
   * 指定された UUID に対応するドキュメントのファイル名を取得する
   *
   * @param {string} uuid - 取得対象のドキュメントの UUID
   * @returns {string} ファイル名
   */
  const getFileNameFromUuid = (uuid) => {
    const documents = statusService.getSnapshot("@Documents") || [];
    const matchedDocument = documents.find((d) => d.uuid === uuid);

    if (!matchedDocument || !matchedDocument.file_path) {
      return "";
    }

    const filePath = String(matchedDocument.file_path);
    const fileName = getFileNameFromFilePath(filePath);
    return fileName;
  };

  useEffect(() => {
    // SelectedCollectionName のサブスクリプション
    const selectedCollectionNameSubscription = statusService
      .getStatus$("@SelectedCollectionName")
      .subscribe((collectionName) => {
        setSelectedCollectionName(collectionName);
        setUserQuery("");

        const collections = statusService.getSnapshot("@Collections") || [];
        const collection = collections.find(
          (c) => c.collection_name === collectionName
        );

        if (!collection || !collection.prompts) {
          setPromptLibrary({ items: [] });
          return;
        }

        // プロンプトライブラリを構築する
        const promptItems = Object.entries(collection.prompts).map(
          ([promptName, promptText]) => ({
            key: promptName,
            label: promptName, // 表示ラベル
            prompt: promptText, // プロンプト本文で、入力欄にセットされる
          })
        );
        const promptLibrary = {
          items: promptItems,
          onClick: ({ key }) => {
            const selected = promptItems.find((item) => item.key === key);
            if (selected) {
              setUserQuery(selected.prompt);
              textareaRef.current?.focus();
            }
          },
        };
        setPromptLibrary(promptLibrary);
      });

    // SelectedKeys のサブスクリプション
    const selectedKeysSubscription = statusService
      .getStatus$("@SelectedKeys")
      .subscribe((keys) => {
        const uuids = [...new Set(keys.map((key) => extractUuidFromKey(key)))];
        setSelectedKeys(uuids);
      });

    // TopNSimilarityDocuments のサブスクリプション
    const topNSimilarityDocumentsSubscription = statusService
      .getStatus$("@TopNSimilarityDocuments")
      .subscribe((documents) => {
        const labelStyle = { width: "8rem" };
        if (!documents || documents.length === 0) {
          return;
        }
        const similarDocumentsInfoMessage = [
          {
            id: createMessageId(),
            type: "similar_documents_info",
            query: "",
            response: "",
            similar_documents_info: documents.map((documentItem) => {
              return {
                title: documentItem.file_path,
                uuid: documentItem.uuid,
                items: [
                  {
                    label: "Similarity",
                    children: <p>{documentItem.similarity}</p>,
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                  {
                    label: "Tags",
                    children: <p>{documentItem.tags.join(", ")}</p>,
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                  {
                    label: "Keywords",
                    children: <p>{documentItem.keywords.join(", ")}</p>,
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                  {
                    label: "Summary",
                    children: <p>{documentItem.summary}</p>,
                    labelStyle: labelStyle,
                    span: "filled",
                  },
                ],
              };
            }),
          },
        ];
        setChatMessages((prevMessages) => [
          ...prevMessages,
          ...similarDocumentsInfoMessage,
        ]);
      });

    return () => {
      selectedCollectionNameSubscription.unsubscribe();
      selectedKeysSubscription.unsubscribe();
      topNSimilarityDocumentsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({
        behavior: "smooth",
      });
      latestMessageRef.current = null;
    }
  }, [chatMessages]);

  return (
    <>
      {messageContextHolder}
      <SessionModal
        visible={isIntroVisible}
        onConfirm={confirmIntro}
      ></SessionModal>
      <Flex
        justify="flest-start"
        align="center"
        className={style.chat_con}
        vertical
      >
        {chatMessages.map((message, index) => {
          const last = index === chatMessages.length - 1;
          return (
            <Fragment key={index}>
              <Flex
                ref={last ? latestMessageRef : null}
                className={style.thread_con}
                style={{
                  height: last ? "100%" : "auto",
                  flex: last ? "0 0  auto" : "1",
                }}
                vertical
              >
                {/* クエリと回答を表示 */}
                {message.type === "query_response" && (
                  <Typography className={style.user_thread_con}>
                    <Typography.Paragraph>
                      <pre>{message.query}</pre>
                    </Typography.Paragraph>
                  </Typography>
                )}
                {(isFetchingAnswer || message.response) && (
                  <Typography
                    style={{
                      paddingBottom: last ? "10rem" : 0,
                    }}
                  >
                    <Skeleton
                      avatar
                      active
                      paragraph={{ rows: 4 }}
                      loading={isFetchingAnswer && last}
                    >
                      {/* 回答を表示 */}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.response}
                      </ReactMarkdown>
                      {/* 参照ドキュメントを表示 */}
                      <Flex gap=".5rem 0" wrap>
                        {message.uuid_list?.map((uuid, index) => {
                          return (
                            <Tag
                              key={uuid}
                              color="gray"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                verticalAlign: "middle",
                              }}
                              icon={<NumberIcon number={index + 1} size={16} />}
                            >
                              {getFileNameFromUuid(uuid)}
                            </Tag>
                          );
                        })}
                      </Flex>
                    </Skeleton>
                  </Typography>
                )}
                {/* 類似度の高いドキュメントの情報を表示 */}
                {message.type === "similar_documents_info" && (
                  <Typography
                    style={{
                      paddingBottom: last ? "10rem" : 0,
                    }}
                  >
                    <Typography className={style.user_thread_con}>
                      <Typography.Paragraph
                        style={{
                          fontWeight: "bold",
                          color: "#1606f2ff",
                          fontSize: "1.2em",
                        }}
                      >
                        類似度の高いドキュメントの情報です。
                      </Typography.Paragraph>
                    </Typography>
                    {message.similar_documents_info.map(
                      (similarDocumentInfoItem, index) => {
                        const { title, uuid, items } = similarDocumentInfoItem;
                        const checked = selectedKeys.includes(uuid);
                        return (
                          <div key={index} style={{ marginTop: "2rem" }}>
                            <Flex
                              style={{ alignItems: "center", gap: "0.5rem" }}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={() => toggleSelection(uuid)}
                              />
                              <Typography.Title level={5} style={{ margin: 0 }}>
                                #{index + 1}{" "}
                                {getFileNameFromUuid(uuid) || title}
                              </Typography.Title>
                            </Flex>
                            <Descriptions
                              size="small"
                              layout="horizontal"
                              items={items}
                            />
                          </div>
                        );
                      }
                    )}
                  </Typography>
                )}
                {/* 初期メッセージを表示 */}
                {message.type === "intro" && (
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

        {/* クエリ入力欄 */}
        <Flex justify="center" className={style.queryBox_con}>
          <Flex className={style.textarea_con} vertical>
            <Input.TextArea
              ref={textareaRef}
              value={userQuery}
              variant="borderless"
              placeholder="send a query about the selected documents..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setUserQuery(e.target.value)}
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
                disabled={!selectedCollectionName || !selectedKeys?.length}
                loading={isFetchingAnswer}
                onClick={handleQuery}
                icon={<SendOutlined style={{ transform: "rotate(270deg)" }} />}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
