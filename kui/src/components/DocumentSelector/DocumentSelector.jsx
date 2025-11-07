/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { useState, useEffect } from "react";
import {
  Flex,
  Typography,
  Input,
  Button,
  Tree,
  Spin,
  InputNumber,
  Slider,
  Popover,
  Divider,
  Tabs,
  Badge,
  message,
} from "antd";
import { SyncOutlined, DownloadOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";
import { splitFilePath } from "@/common/utility";
import style from "./DocumentSelector.module.css";

/**
 * Document Collection 内のドキュメントを選択するコンポーネント
 *
 * @returns {JSX.Element} The rendered DocumentSelector component.
 */
export default function DocumentSelector() {
  const [isFetching, setIsFetching] = useState(false);
  const [selectionQuery, setSelectionQuery] = useState("");
  const [selectedCollectionName, setSelectedCollectionName] = useState("");
  const [categoryTree, setCategoryTree] = useState([]);
  const [tagTree, setTagTree] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [activeViewName, setActiveViewName] = useState("Category");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [inputValueSim, setInputValueSim] = useState(0);
  const [BadgeValue, setBadgeValue] = useState("0 documents selected");
  const [messageApi, messageContextHolder] = message.useMessage();

  // 選択されたドキュメント数のバッジ
  const selectedCountBadge = (
    <Badge.Ribbon text={BadgeValue}>
      <span
        style={{
          display: "inline-block",
          width: "10rem",
        }}
      ></span>
    </Badge.Ribbon>
  );

  /**
   * カテゴリービューのツリーデータを生成する
   *
   * @param {[]} documents - ドキュメントデータの配列
   * @returns {[]} - ツリーデータの配列
   */
  const generateCategoryViewTree = (documents = []) => {
    // データのサンプル
    //
    // documents = [
    //   {
    //     uuid: "uuid-1",
    //     file_path: "Folder1\\SubfolderA\\file1.txt",
    //     keywords: ["kw1", "kw2"],
    //     summary: "This is file 1",
    //     tags: ["tag1"]
    //   },
    //   ...
    // ];
    //
    // tree =
    // [
    //   {
    //     title: "Folder1",
    //     key: "Folder1",
    //     children: [
    //       {
    //         title: "SubfolderA",
    //         key: "Folder1/SubfolderA",
    //         children: [
    //           {
    //             title: "file1.txt",
    //             key: "uuid-1",           // leaf は uuid を key にする
    //             icon: <DownloadOutlined ... />,
    //             similarity: 0.12,
    //             keywords: ["kw1", "kw2"],
    //             summary: "This is file 1",
    //             tags: ["tag1"]
    //           }
    //         ]
    //       }
    //     ]
    //   },
    //   ...
    // ]

    /**
     * ツリーにアイテムを再帰的に追加する
     *
     * @param {[]} tree - ツリー配列 (初回は空配列を渡し、以降は再帰的に子ノードの配列を渡す)
     * @param {[]} pathSegments - 分割されたパスの配列
     * @param {Object} documentItem - ドキュメントアイテムオブジェクト
     * @returns {void}
     */
    function addTreeItemsRecursively(tree, pathSegments, documentItem) {
      // pathSegments が空配列の場合は終了
      if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
        return;
      }

      const [firstPathSegment, ...restPathSegments] = pathSegments;
      let treeNode = tree.find((item) => item.title === firstPathSegment);
      // ノードが存在しない場合は新規作成
      if (!treeNode) {
        const isLeaf = restPathSegments.length === 0;
        treeNode = {
          title: firstPathSegment,
          // リーフノードの場合は uuid を key にする
          key: isLeaf ? documentItem.uuid : firstPathSegment,
          ...(isLeaf && {
            icon: (
              <DownloadOutlined
                title="download"
                onClick={(e) => handleDocumentDownload(e, documentItem)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1677ff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "unset")}
              />
            ),
            similarity: 0,
            keywords: documentItem.keywords,
            summary: documentItem.summary,
            tags: documentItem.tags,
          }),
        };
        tree.push(treeNode);
      }
      if (restPathSegments.length > 0) {
        if (!treeNode.children) {
          treeNode.children = [];
        }
        addTreeItemsRecursively(
          treeNode.children,
          restPathSegments,
          documentItem
        );
      }
    }

    const tree = [];
    documents.forEach((documentItem) => {
      const parts = splitFilePath(documentItem.file_path);
      addTreeItemsRecursively(tree, parts, documentItem);
    });

    return tree;
  };

  // タグビューでのキーの区切り文字
  const TAG_KEY_DELIMITER = "::";

  /**
   * タグキーからUUIDを抽出する
   *
   * @param {string} key - TAG_KEY_DELIMITERで区切られたタグキー
   * @returns {string} 抽出されたUUID
   * @throws {Error} 無効なタグキー形式の場合
   *
   * @example
   * // カテゴリービューでのキー key: <uuid>
   * // タグビューでのキー key: <tag><TAG_KEY_DELIMITER><uuid>
   * const uuid = getUuidForTagKey("tag1::123e4567-e89b-12d3-a456-426614174000");
   * // returns "123e4567-e89b-12d3-a456-426614174000"
   */
  const extractUuidFromKey = (key) => {
    const keyParts = key.split(TAG_KEY_DELIMITER);
    if (keyParts.length == 1) {
      return keyParts[0];
    } else if (keyParts.length === 2) {
      return keyParts[1];
    } else {
      throw new Error(`Invalid tag key format: ${key}`);
    }
  };

  /**
   * タグビューのツリーデータを生成する
   *
   * @param {[]} documents - ドキュメントデータの配列
   * @returns {[]} - ツリーデータの配列
   */
  const generateTagViewTree = (documents = []) => {
    // データのサンプル
    //
    // documents = [
    //   {
    //     uuid: "uuid-1",
    //     file_path: "Folder1\\SubfolderA\\file1.txt",
    //     keywords: ["kw1", "kw2"],
    //     summary: "This is file 1",
    //     tags: ["tag1"]
    //   },
    //   ...
    // ];
    //
    // tree =
    // [
    //   {
    //     title: "tag1",
    //     key: "tag1",
    //     children: [
    //       {
    //         title: "file1.txt",
    //         key: "tag1::uuid-1",           // leaf は tag + uuid を key にする
    //         icon: <DownloadOutlined ... />,
    //         similarity: 0.12,
    //         keywords: ["kw1", "kw2"],
    //         summary: "This is file 1",
    //         tags: ["tag1"]
    //       }
    //     ]
    //   },
    //   ...
    // ]

    const collections = statusService.getSnapshot("collections") || [];
    const selectedCollection = collections.find(
      (c) => c.collection_name === selectedCollectionName
    );
    if (!selectedCollection || !Array.isArray(selectedCollection.tags)) {
      return [];
    }

    // タグごとにドキュメントを分類
    const documentItemsByTag = {};
    for (const documentItem of documents) {
      if (!Array.isArray(documentItem.tags)) {
        continue;
      }
      const filePathSegments = splitFilePath(documentItem.file_path);
      const fileName = filePathSegments.at(-1);
      for (const tag of documentItem.tags) {
        (documentItemsByTag[tag] ||= []).push({
          icon: (
            <DownloadOutlined
              title="download"
              onClick={(e) => handleDocumentDownload(e, documentItem)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1677ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "unset")}
            />
          ),
          title: fileName,
          key: `${tag}${TAG_KEY_DELIMITER}${documentItem.uuid}`,
          keywords: documentItem.keywords,
          summary: documentItem.summary,
          similarity: 0,
        });
      }
    }

    // ツリーデータを構築
    const tree = selectedCollection.tags
      .map((tag) => ({
        title: tag,
        key: tag,
        children: documentItemsByTag[tag] || [],
      }))
      .filter((node) => node.children.length > 0);

    return tree;
  };

  /**
   * 葉ノードのキーをすべて取得する
   *
   * @param {[]} tree - ツリーデータの配列
   * @param {[]} keys - 再帰的に収集されたキーの配列（初回は空配列を渡す）
   * @returns {[]} - 葉ノードのキーの配列
   */
  const getLeafKeys = (tree, keys = []) => {
    for (const node of tree || []) {
      if (!node?.children || node.children.length === 0) {
        if (node?.key !== undefined) {
          keys.push(node.key);
        }
      } else {
        getLeafKeys(node.children, keys);
      }
    }
    return keys;
  };

  /**
   * 葉ノード以外のノードのキーの配列を取得する
   *
   * @param {[]} tree - ツリーデータの配列
   * @returns {[]} - 葉ノード以外のノードのキーの配列
   */
  const getNonLeafKeys = (tree) => {
    // treeData =
    //   [
    //     { key: "A", children: [{ key: "A/1" }] },
    //     { key: "B", children: [{ key: "B/1", children: [{ key: "B/1/a" }] }] }
    //   ]
    // keys = ["A", "B", "B/1"]
    let keys = [];
    tree.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.push(node.key);
        keys = keys.concat(getNonLeafKeys(node.children));
      }
    });
    return keys;
  };

  /**
   * ツリーデータを類似度でソートする
   *
   * @param {[]} tree - ツリーデータの配列
   * @param {*} order - ソートの順序（"asc" または "desc"）
   * @returns {[]} - 類似度でソートされたツリーデータの配列
   */
  const sortTreeBySimilarity = (tree, order = "desc") => {
    const compareBySimilarity = (a, b) => {
      const sa = a.similarity ?? -Infinity;
      const sb = b.similarity ?? -Infinity;
      return order === "asc" ? sa - sb : sb - sa;
    };

    if (!Array.isArray(tree) || tree.length === 0) {
      return [];
    }
    return tree
      .map((node) => {
        // children が無ければそのまま返す
        if (!Array.isArray(node.children) || node.children.length === 0) {
          return node;
        }
        // 子は再帰でソートして新しい配列を返す
        return {
          ...node,
          children: sortTreeBySimilarity(node.children, order),
        };
      })
      .sort(compareBySimilarity);
  };

  /**
   * ツリーデータのノードをキーでインデックス化する
   *
   * @param {Array} tree - ツリーデータの配列
   * @returns {Map} ノードのキーをキー、対応するノードオブジェクトを値とするMap
   *
   * @example
   * const tree = [
   *   { key: 'root', children: [{ key: 'child1' }, { key: 'child2' }] }
   * ];
   * const treeMap = indexNodesByKey(tree);
   * // treeMapは'root'、'child1'、'child2'のエントリを含む
   * node1 = treeMap.get('child1');
   */
  const indexNodesByKey = (tree) => {
    const map = new Map();

    function traverse(nodes) {
      nodes.forEach((node) => {
        map.set(node.key, node);
        if (node.children) {
          traverse(node.children);
        }
      });
    }

    traverse(tree);
    return map;
  };

  /**
   * 指定された閾値を上回る類似度を持つノードのキーの配列を取得する
   *
   * @param {Array} tree - 検索対象のツリー構造データの配列
   * @param {number} threshold - 類似度の閾値
   * @returns {Array<string>} 閾値を上回る類似度を持つノードのキーの配列
   */
  const getKeysAboveThreshold = (tree, threshold) => {
    let keys = [];

    function traverse(nodes) {
      nodes.forEach((node) => {
        if (node.similarity > threshold) {
          keys.push(node.key);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    }

    traverse(tree);
    return keys;
  };

  /**
   * ノードのタイトルをレンダリングする
   * キーワードまたは要約が存在する場合は、ポップオーバー付きのタイトルを表示し、
   * そうでない場合は単純なタイトルスパンを返します。
   *
   * @param {Object} node - レンダリングするノードオブジェクト
   * @returns {JSX.Element} レンダリングされたタイトル要素
   */
  const renderTitle = (node) => {
    const hasKeywords =
      Array.isArray(node.keywords) && node.keywords.length > 0;
    const hasSummary = Boolean(node.summary);

    if (!hasKeywords && !hasSummary) {
      return <span>{node.title}</span>;
    }
    return (
      <Popover
        content={
          <>
            <Flex
              style={{
                maxWidth: "30dvw",
              }}
              vertical
            >
              <Divider orientation="left" plain>
                <span>keywords</span>
              </Divider>
              <p>{node.keywords?.join(",")}</p>
              <Divider orientation="left" plain>
                <span>summary</span>
              </Divider>
              <p>{node.summary}</p>
            </Flex>
          </>
        }
        style={{
          width: "20%",
        }}
        trigger="hover"
        placement="topRight"
      >
        <span
          style={{
            whiteSpace: "nowrap",
          }}
        >
          <small style={{ marginRight: "0.5rem" }}>
            <i>{(Math.trunc(node.similarity * 1000) / 1000).toFixed(3)}</i>
          </small>
          {node.title}
        </span>
      </Popover>
    );
  };

  /**
   * ツリーのチェック状態が変更された際に実行されるハンドラ
   *
   * @param {string[]} selectedKeysFromEvent - イベントから取得されたチェック済みキーの配列
   * @param {Object} info - チェック操作に関する情報オブジェクト
   */
  const onCheck = (selectedKeysFromEvent, info) => {
    let updatedSelectedKeys = [];
    if (activeViewName === "Tag") {
      // キーの形式が tag::uuid なので、uuid 部分でマッチングを行う
      const leafKeys = getLeafKeys(tagTree);
      const uuid = extractUuidFromKey(info.node.key);
      let matchedKeys = leafKeys.filter((k) => k.endsWith(uuid));
      if (matchedKeys.length === 0 && info.node.children?.length) {
        const childUuids = info.node.children.map((child) =>
          extractUuidFromKey(child.key)
        );
        matchedKeys = leafKeys.filter((key) =>
          childUuids.includes(extractUuidFromKey(key))
        );
      }
      updatedSelectedKeys = info.checked
        ? [...new Set([...selectedKeysFromEvent, ...matchedKeys])]
        : selectedKeysFromEvent.filter((k) => !matchedKeys.includes(k));
      updatedSelectedKeys = updatedSelectedKeys.filter((k) =>
        leafKeys.includes(k)
      );
    } else if (activeViewName === "Category") {
      // カテゴリービューではそのままリーフノードのキーでフィルタリングする
      const leafKeys = getLeafKeys(categoryTree);
      updatedSelectedKeys = selectedKeysFromEvent.filter((k) =>
        leafKeys.includes(k)
      );
    }
    setSelectedKeys(updatedSelectedKeys);
  };

  /**
   * 類似度の値が変更された際のハンドラー
   *
   * 入力値がNaNの場合は処理を中断し、有効な数値の場合のみ状態を更新する
   *
   * @param {number} inputValueSim - 入力された類似度の値
   * @returns {void} 戻り値なし
   */
  const onSimilarityChange = (inputValueSim) => {
    if (Number.isNaN(inputValueSim)) {
      return;
    }
    setInputValueSim(inputValueSim);
  };

  /**
   * 類似度の変更が完了した際のハンドラー
   *
   * 類似度の値を更新し、アクティブなビュー（タグまたはカテゴリ）に応じて
   * 閾値を超えるキーを取得してチェック状態を更新する
   *
   * @param {number} similarity - 設定された類似度の値
   */
  const onSimilarityChangeComplete = (similarity) => {
    setInputValueSim(similarity);

    const tree = activeViewName === "Tag" ? tagTree : categoryTree;
    const selectedKeys = getKeysAboveThreshold(tree, similarity);

    setSelectedKeys(selectedKeys);
  };

  /**
   * 選択クエリを実行し、文書の類似度を更新するハンドラ
   *
   * 指定されたコレクションに対してクエリを実行し、返された文書の類似度情報を
   * カテゴリツリー、タグツリー、文書リストに反映する。また、類似度順にソートし、
   * 上位3件の類似文書をステータスサービスに保存する。
   *
   * @async
   * @function submitSelectionQuery
   * @returns {Promise<void>} 処理完了を示すPromise
   *
   * @throws {Error} APIリクエストが失敗した場合
   *
   * @requires selectedCollectionName コレクション名が設定されていること
   * @requires selectionQuery クエリ文字列が空でないこと
   */
  const submitSelectionQuery = async () => {
    if (!selectedCollectionName || !selectionQuery.trim()) {
      return;
    }

    setIsFetching(true);
    try {
      const response = await apiService.postSelectDocuments(
        selectedCollectionName,
        { query: selectionQuery }
      );

      const categoryTreeMap = indexNodesByKey(categoryTree);
      const tagTreeMap = indexNodesByKey(tagTree);
      const documents = statusService.getSnapshot("documents");
      const documentsMap = new Map(documents.map((d) => [d.uuid, d]));

      let maxSimilarity = 0;
      const uuid_list = [];

      for (const { uuid, similarity } of response.selected_documents) {
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
        // カテゴリービューの更新
        const categoryItem = categoryTreeMap.get(uuid);
        if (categoryItem) {
          categoryItem.similarity = similarity;
        }
        // タグビューの更新
        for (const [key, node] of tagTreeMap) {
          if (extractUuidFromKey(key) === uuid) {
            node.similarity = similarity;
          }
        }
        // update currentDocuments
        const document = documentsMap.get(uuid);
        if (document) {
          document.similarity = similarity;
        }
        uuid_list.push(uuid);
      }
      // topNsimilarityDocuments のステータスを更新
      statusService.patchStatus(
        "topNsimilarityDocuments",
        sortTreeBySimilarity(documents).slice(0, 3)
      );

      const sortedcategoryTree = sortTreeBySimilarity(categoryTree);
      setCategoryTree(sortedcategoryTree);

      const sortedTagTree = sortTreeBySimilarity(tagTree);
      setTagTree(sortedTagTree);

      setSelectedKeys(uuid_list);
      onSimilarityChangeComplete(
        Number((Math.trunc(maxSimilarity * 1000) / 1000).toFixed(3))
      );
    } catch (error) {
      messageApi.open({
        type: "error",
        content: `Error in submitSelectionQuery: ${error}`,
      });
    } finally {
      setIsFetching(false);
    }
  };

  /**
   * 選択クエリの入力フィールドでキーダウンイベントを処理するハンドラ
   *
   * Enterキーが押された場合（Shiftキーとの組み合わせでない場合）、
   * デフォルト動作を防止して選択クエリを送信する
   *
   * @param {KeyboardEvent} e - キーボードイベントオブジェクト
   */
  const handleSelectionQueryKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitSelectionQuery();
    }
  };

  /**
   * ドキュメントダウンロード処理を行うイベントハンドラー
   * @param {Event} e - クリックイベントオブジェクト
   * @param {Object} documentItem - ダウンロード対象のドキュメントデータ
   */
  const handleDocumentDownload = (e, documentItem) => {
    e.stopPropagation();
    apiService.getDocumentsDownload(selectedCollectionName, documentItem.uuid);
  };

  // selectedCollectionName の変更を監視する
  useEffect(() => {
    const documentCollectionSubscription = statusService
      .getStatus$("documentCollection")
      .subscribe((collectionName) => {
        setSelectedCollectionName(collectionName);
      });
    return () => {
      documentCollectionSubscription.unsubscribe();
    };
  }, []);

  // selectedCollectionName が変更されたらドキュメントデータを取得する
  useEffect(() => {
    const fetchFolderData = async () => {
      setIsFetching(true);
      try {
        const response = await apiService.getDocuments(selectedCollectionName);
        statusService.patchStatus("documents", response["documents"]);
        setCategoryTree(generateCategoryViewTree(response["documents"]));
        setTagTree(generateTagViewTree(response["documents"]));
        setInputValueSim(0.0);
        setSelectedKeys([]);
      } catch (error) {
        messageApi.open({
          type: "error",
          content: `Error fetching documents: ${error}`,
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (selectedCollectionName) {
      fetchFolderData();
    }
  }, [selectedCollectionName]);

  useEffect(() => {
    const trees = {
      Category: categoryTree,
      Tag: tagTree,
    };
    const viewTree = trees[activeViewName] || [];

    // ビューの更新
    setTreeData(viewTree);
    setExpandedKeys(getNonLeafKeys(viewTree));

    // チェック状態が空なら何もしない
    if (!selectedKeys || selectedKeys.length === 0) {
      return;
    }

    // selectedKeys から UUID を抽出する
    const uuids = [...new Set(selectedKeys.map((k) => extractUuidFromKey(k)))];

    let selectedKeysForView = [];
    if (activeViewName === "Tag") {
      // タグビューでは tag::uuid 形式のリーフキーを集める
      const tagLeafKeys = getLeafKeys(tagTree);
      const matched = new Set();
      for (const u of uuids) {
        for (const k of tagLeafKeys) {
          if (k.endsWith(u)) matched.add(k);
        }
      }
      selectedKeysForView = Array.from(matched);
    } else {
      // カテゴリービューは UUID のまま
      selectedKeysForView = uuids;
    }

    // 差分がある場合のみ更新する
    const keysBeforeUpdate = new Set(selectedKeys);
    const keysAfterUpdate = new Set(selectedKeysForView);
    const isSame =
      keysBeforeUpdate.size === keysAfterUpdate.size &&
      [...keysAfterUpdate].every((v) => keysBeforeUpdate.has(v));
    if (!isSame) {
      setSelectedKeys(selectedKeysForView);
    }
  }, [activeViewName, categoryTree, tagTree, selectedKeys]);

  // 選択済みドキュメントのキーと数を更新する
  useEffect(() => {
    // 選択済みドキュメントのキーをステータスに保存
    statusService.patchStatus("selectedKeys", selectedKeys);

    // 選択済みドキュメント数の更新
    const selectedDocumentCount = new Set(
      selectedKeys.map((key) => key.split(TAG_KEY_DELIMITER).pop())
    ).size;
    setBadgeValue(
      selectedDocumentCount === 1
        ? `${selectedDocumentCount} document selected`
        : `${selectedDocumentCount} documents selected`
    );
  }, [selectedKeys]);

  return (
    <>
      {messageContextHolder}
      <Flex
        justify="flex-start"
        align="flex-start"
        className={style.documentSelector_con}
        flex={1}
        vertical
        gap={"small"}
      >
        <Typography.Title level={4}>Document Selector</Typography.Title>
        <Input.TextArea
          value={selectionQuery}
          placeholder="send a query to select documents..."
          onKeyDown={handleSelectionQueryKeyDown}
          onChange={(e) => setSelectionQuery(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
        />
        <Flex justify="flex-end" style={{ width: "100%" }}>
          <Button
            type="primary"
            onClick={submitSelectionQuery}
            loading={isFetching ? { icon: <SyncOutlined spin /> } : null}
          >
            Select
          </Button>
        </Flex>
        <Flex gap="small" justify="space-between" style={{ width: "100%" }}>
          <Typography.Title level={4}>Similarity</Typography.Title>
          <Slider
            min={0}
            max={1}
            style={{
              flex: 1,
            }}
            value={typeof inputValueSim === "number" ? inputValueSim : 0}
            disabled={treeData.length === 0}
            onChange={onSimilarityChange}
            step={0.01}
            onChangeComplete={onSimilarityChangeComplete}
          />
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            onChange={onSimilarityChangeComplete}
            disabled={treeData.length === 0}
            value={inputValueSim}
          />
        </Flex>
        <Tabs
          defaultActiveKey="Category"
          centered
          style={{ width: "100%" }}
          value={activeViewName}
          tabBarExtraContent={selectedCountBadge}
          onChange={(value) => setActiveViewName(value)}
          items={[
            {
              key: "Category",
              label: "Category View",
            },
            {
              key: "Tag",
              label: "Tag View",
            },
          ]}
        />
        <div
          style={{
            width: "100%",
            flex: 1,
            overflow: "auto",
          }}
        >
          <Spin
            spinning={isFetching}
            style={{
              position: "relative",
            }}
          >
            <Tree.DirectoryTree
              checkable
              showLine
              style={{ width: "max-content" }}
              selectable={false}
              treeData={treeData}
              expandedKeys={expandedKeys}
              titleRender={(node) => renderTitle(node)}
              checkedKeys={selectedKeys}
              onCheck={onCheck}
            />
          </Spin>
        </div>
      </Flex>
    </>
  );
}
