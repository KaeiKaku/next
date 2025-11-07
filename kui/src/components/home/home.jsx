/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { Flex, Splitter } from "antd";
import Header from "@/components/Header";
import DocumentCollection from "@/components/DocumentCollection";
import DocumentSelector from "@/components/DocumentSelector";
import Chat from "@/components/Chat";
import style from "./Home.module.css";

export default function Home() {
  return (
    <>
      <Header />
      <Splitter className={style.home_con}>
        <Splitter.Panel defaultSize="30%" min="20%" max="50%">
          <Flex vertical style={{ height: "100%" }}>
            <DocumentCollection />
            <DocumentSelector />
          </Flex>
        </Splitter.Panel>
        <Splitter.Panel>
          <Flex vertical style={{ height: "100%" }}>
            <Chat />
          </Flex>
        </Splitter.Panel>
      </Splitter>
    </>
  );
}
