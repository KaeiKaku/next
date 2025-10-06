import style from "./documentCollection.module.css";
import { Flex, Typography } from "antd";

export default function DocumentCollection() {
  return (
    <>
      <Flex
        justify="center"
        align="center"
        className={style.documentCollection_con}
        vertical
      >
        <Typography.Title level={3}>Document Collection</Typography.Title>
      </Flex>
    </>
  );
}
