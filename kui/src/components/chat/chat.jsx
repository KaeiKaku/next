import { Fragment, useState, useEffect, useRef } from "react";
import { Flex, Typography, Input, Button, Skeleton } from "antd";
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
  const latestMessageRef = useRef(null);

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
    const docSub = statusService
      .getStatus$("documentCollection")
      .subscribe((_documentCollection) => {
        setDocumentCollection(_documentCollection);
      });

    const fileSub = statusService
      .getStatus$("fileCollection")
      .subscribe((_fileCollection) => {
        setFileCollection(_fileCollection);
      });

    const predefinedPromptSub = statusService
      .getStatus$("predefinedPrompt")
      .subscribe((_predefinedPrompt) => {
        setQuery(_predefinedPrompt);
      });

    return () => {
      docSub.unsubscribe();
      fileSub.unsubscribe();
      predefinedPromptSub.unsubscribe();
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
                }}
                vertical
              >
                <Typography className={styles.user_thread_con}>
                  <Paragraph>
                    <pre>{message.query}</pre>
                  </Paragraph>
                </Typography>
                <Typography className={styles.ai_thread_con}>
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
              </Flex>
            </Fragment>
          );
        })}

        {/* query box */}
        <Flex justify="center" className={styles.queryBox_con}>
          <Flex className={styles.textarea_con} vertical>
            <TextArea
              value={query}
              variant="borderless"
              placeholder="send a message..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setQuery(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 10 }}
            />
            <Flex justify="flex-end">
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
