import style from "./header.module.css";
import { Flex, Typography } from "antd";

export default function Header() {
  return (
    <>
      <Flex
        className={style.header_con}
        gap="middle"
        align="center"
        justify="center"
      >
        <Typography.Title level={2} style={{ color: "white" }}>
          ChatBot
        </Typography.Title>
      </Flex>
    </>
  );
}
