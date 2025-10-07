import style from "./documentCollection.module.css";
import { Flex, Typography, Select, Space, Button } from "antd";

const options = [
  {
    label: <span>manager</span>,
    title: "manager",
    options: [
      { label: <span>m1</span>, value: "m1" },
      { label: <span>m2</span>, value: "m2" },
      { label: <span>m3</span>, value: "m3" },
      { label: <span>m4</span>, value: "m4" },
    ],
  },
  {
    label: <span>engineer</span>,
    title: "engineer",
    options: [
      { label: <span>e1</span>, value: "e1" },
      { label: <span>e2</span>, value: "e2" },
      { label: <span>e3</span>, value: "e3" },
      { label: <span>e4</span>, value: "e4" },
    ],
  },
];

const handleChange = (value) => {
  console.log(`selected ${value}`);
};

export default function DocumentCollection() {
  return (
    <>
      <Flex
        justify="center"
        align="flex-start"
        className={style.documentCollection_con}
        vertical
      >
        <Typography.Title level={4}>Document Collection</Typography.Title>
        <Space.Compact block>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="Tags Mode"
            onChange={handleChange}
            options={options}
          />
          <Button type="primary">Search</Button>
        </Space.Compact>
      </Flex>
    </>
  );
}
