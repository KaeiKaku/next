import { useState } from "react";
import { Flex, Typography, Select, Space, Spin } from "antd";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";
import style from "./documentCollection.module.css";

export default function DocumentCollection() {
  const [fetching, setFetching] = useState(false);
  const [document_opotions, setOptions] = useState("");

  const handleChange = (value) => {
    statusService.patchStatus("documentCollection", value);
    statusService.patchStatus("fileCollection", []);
  };

  const handleFocus = async () => {
    if (document_opotions > 0) return;
    setFetching(true);

    const response = await apiService.getCollections();

    const new_document_opotions = [
      {
        label: "Documents",
        title: "Documents",
        options: (response.collections || "").map((datum) => ({
          label: datum,
          value: datum,
        })),
      },
    ];

    setOptions(new_document_opotions);
    setFetching(false);
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
            showSearch
            style={{ width: "100%" }}
            placeholder="collect documents..."
            notFoundContent={
              fetching ? <Spin size="small" /> : "No results found"
            }
            onFocus={handleFocus}
            onChange={handleChange}
            options={document_opotions}
          />
        </Space.Compact>
      </Flex>
    </>
  );
}
