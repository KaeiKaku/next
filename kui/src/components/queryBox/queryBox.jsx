import { useState } from "react";
import { Flex, Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
import styles from "./queryBox.module.css";

const { TextArea } = Input;

export default function QueryBox({ selectedCollection, selectedFile }) {
  const [query, setValue] = useState("");

  const handlePost = async () => {
    if (!selectedCollection || !query) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/inquire/${encodeURIComponent(
          selectedCollection[0]
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
            uuid_list: selectedFile,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("error:", error);
    }
  };
  return (
    <>
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
              icon={<SendOutlined rotate={270} onClick={handlePost} />}
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
