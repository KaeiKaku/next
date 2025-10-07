import { Flex } from "antd";
import styles from "./chat.module.css";
import QueryBox from "../queryBox/queryBox";

export default function Chat() {
  return (
    <>
      <Flex justify="center" className={styles.chat_con}>
        <h3>chat</h3>
        <QueryBox />
      </Flex>
    </>
  );
}
