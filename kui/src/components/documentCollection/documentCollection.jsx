import { useState, useEffect } from "react";
import style from "./documentCollection.module.css";
import { Flex, Typography, Select, Space } from "antd";

export default function DocumentCollection({ onChange }) {
  const [document_opotions, setOptions] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/collections");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const new_document_opotions = [
          {
            label: "Documents",
            title: "Documents",
            options: (data.collections || []).map((datum) => ({
              label: datum,
              value: datum,
            })),
          },
        ];

        setOptions(new_document_opotions);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchCollections();
  }, []);

  const handleChange = (value) => {
    onChange?.(value);
  };

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
            placeholder="collect documents..."
            onChange={handleChange}
            options={document_opotions}
          />
        </Space.Compact>
      </Flex>
    </>
  );
}
