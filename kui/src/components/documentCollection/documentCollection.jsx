/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { useState } from "react";
import { Flex, Typography, Select, Space, Spin, message } from "antd";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";
import style from "./DocumentCollection.module.css";

/**
 * Document Collection を選択するコンポーネント
 *
 * @returns {JSX.Element} The rendered DocumentCollection component.
 */
export default function DocumentCollection() {
  const [isFetching, setIsFetching] = useState(false);
  const [collectionOptions, setCollectionOptions] = useState([]);
  const [messageApi, messageContextHolder] = message.useMessage();

  const handleChange = (value) => {
    // 選択されたドキュメントコレクションをステータスにパッチ
    statusService.patchStatus("documentCollection", value);
  };

  const handleFocus = async () => {
    // データ取得中もしくはデータ取得済みであれば何もしない
    if (isFetching || collectionOptions.length > 0) {
      return;
    }

    setIsFetching(true);
    try {
      // ドキュメントコレクションの情報を取得
      const response = await apiService.getCollections();
      const collections = Array.isArray(response?.collections)
        ? response.collections
        : [];
      statusService.patchStatus("collections", collections);

      // 取得したデータをセレクトボックスのオプションを作成
      const newCollectionOptions = [
        {
          label: "Documents",
          title: "Documents",
          options: (response.collections || []).map((collection) => ({
            label: collection["collection_name"],
            value: collection["collection_name"],
          })),
        },
      ];
      setCollectionOptions(newCollectionOptions);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: `Failed to fetch document collections: ${error}`,
      });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      {messageContextHolder}
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
            placeholder="select a document collection..."
            notFoundContent={
              isFetching ? <Spin size="small" /> : "No collection found"
            }
            onFocus={handleFocus}
            onChange={handleChange}
            options={collectionOptions}
          />
        </Space.Compact>
      </Flex>
    </>
  );
}
