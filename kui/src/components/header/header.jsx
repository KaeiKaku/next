import style from "./header.module.css";
import { Flex, Typography } from "antd";

export default function Header() {
  return (
    <>
      <Flex className={style.header_con} align="center" justify="center">
        <Typography.Title level={3} style={{ color: "white", margin: 0 }}>
          ChatBot
        </Typography.Title>
      </Flex>
    </>
  );
}
