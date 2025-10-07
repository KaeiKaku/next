import { Flex, Typography } from "antd";
import styles from "./chat.module.css";
import QueryBox from "../queryBox/queryBox";

const { Paragraph } = Typography;

export default function Chat({ selectedCollection, selectedFile }) {
  return (
    <>
      <Flex justify="center" className={styles.chat_con}>
        <Flex className={styles.thread_con} vertical>
          <Typography className={styles.user_thread_con}>
            <Paragraph>
              <pre>
                user block ...user block ...user block ...user block ...user
                block ...user block ...user block ... user block ... user block
                ...
              </pre>
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
        <QueryBox
          selectedCollection={selectedCollection}
          selectedFile={selectedFile}
        />
      </Flex>
    </>
  );
}
