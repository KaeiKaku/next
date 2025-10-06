import { Flex, Splitter, Typography } from "antd";
import Header from "@/components/header/header";
import DocumentCollection from "@/components/documentCollection/documentCollection";

const Desc = (props) => (
  <Flex justify="center" align="center" style={{ height: "100%" }}>
    <Typography.Title
      type="secondary"
      level={5}
      style={{ whiteSpace: "nowrap" }}
    >
      {props.text}
    </Typography.Title>
  </Flex>
);

export default function Home() {
  return (
    <>
      <Header />
      <Splitter>
        <Splitter.Panel defaultSize="30%" min="20%" max="50%">
          <DocumentCollection />
        </Splitter.Panel>
        <Splitter.Panel>
          <Desc text="Second" />
        </Splitter.Panel>
      </Splitter>
    </>
  );
}
