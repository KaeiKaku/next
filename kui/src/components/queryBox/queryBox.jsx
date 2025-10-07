import { useState } from "react";
import { Flex, Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
import styles from "./queryBox.module.css";

const { TextArea } = Input;

export default function QueryBox() {
  const [value, setValue] = useState("");
  return (
    <>
      <Flex justify="center" className={styles.queryBox_con}>
        <Flex className={styles.textarea_con} vertical>
          <TextArea
            value={value}
            variant="borderless"
            onChange={(e) => setValue(e.target.value)}
            placeholder="send a message..."
            autoSize={{ minRows: 1, maxRows: 10 }}
          />
          <Flex justify="flex-end">
            <Button shape="circle" icon={<SendOutlined rotate={270} />} />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
