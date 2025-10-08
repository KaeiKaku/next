import { Fragment, useState, useEffect, useRef } from "react";
import { Flex, Typography, Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import styles from "./chat.module.css";

const { Paragraph } = Typography;
const { TextArea } = Input;

export default function Chat() {
  const [query, setValue] = useState();
  const [documentCollection, setDocumentCollection] = useState();
  const [fileCollection, setFileCollection] = useState();
  const [messages, setMessages] = useState([]);
  const latestMessageRef = useRef(null);

  const handleQuery = async () => {
    // if (!selectedCollection || !fileCollection || !query) return;

    const new_messages = [
      {
        query: query,
        response:
          "response...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AIresponse...AI",
      },
    ];

    setMessages((prev) => [...prev, ...new_messages]);

    // console.log(messageContainerRef.current.scrollTop);
    // console.log(messages);

    // try {
    //   const response = await fetch(
    //     `http://127.0.0.1:8000/inquire/${encodeURIComponent(
    //       documentCollection
    //     )}`,
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         query: query,
    //         uuid_list: fileCollection,
    //       }),
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }

    //   const result = await response.json();
    //   console.log(result);
    // } catch (error) {
    //   console.error("error:", error);
    // }
  };

  useEffect(() => {
    const documentCollection$ = statusService.getStatus$("documentCollection");
    const fileCollection$ = statusService.getStatus$("fileCollection");

    const docSub = documentCollection$.subscribe((_documentCollection) => {
      setDocumentCollection(_documentCollection.join());
    });
    const fileSub = fileCollection$.subscribe((_fileCollection) => {
      setFileCollection(_fileCollection);
    });

    return () => {
      docSub.unsubscribe();
      fileSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: "smooth" });
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
          return (
            <Fragment key={index}>
              <Flex
                ref={index === messages.length - 1 ? latestMessageRef : null}
                className={styles.thread_con}
                vertical
              >
                <Typography className={styles.user_thread_con}>
                  <Paragraph>
                    <pre>{message.query}</pre>
                  </Paragraph>
                </Typography>
                <Typography>
                  <Paragraph>
                    AI response...AI response...AI response...AI response... AI
                    response...AI response...AI response...AI response...AI
                    response...AI response...AI response... AI response...AI
                    response...AI response...AI response... AI response...AI
                    response...AI response...AI response...AI response...AI
                    response...AI response...AI response... AI response...AI
                    response...AI response...
                  </Paragraph>
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
              onChange={(e) => setValue(e.target.value)}
              placeholder="send a message..."
              autoSize={{ minRows: 1, maxRows: 10 }}
            />
            <Flex justify="flex-end">
              <Button
                shape="circle"
                icon={<SendOutlined rotate={270} onClick={handleQuery} />}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
