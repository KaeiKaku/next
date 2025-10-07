import { Flex } from "antd";
import styles from "./queryBox.module.css";

export default function QueryBox() {
  return (
    <>
      <Flex justify="center" className={styles.queryBox_con}>
        <h3>query</h3>
      </Flex>
    </>
  );
}
