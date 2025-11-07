/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { Flex, Typography } from "antd";
import style from "./Header.module.css";

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
