/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { SyncOutlined, DownloadOutlined, SendOutlined } from "@ant-design/icons";
import { statusService } from "@/common/status";
import { apiService } from "@/service/api.service";
import { splitFilePath } from "@/common/utility";
import { extractUuidFromKey, buildTagKey } from "@/common/common";
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
  const [similarityTree, setSimilarityTree] = useState([]);
  const [activeViewName, setActiveViewName] = useState("Category");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [inputValueSim, setInputValueSim] = useState(0);
  const [selectedDocumentCountText, setSelectedDocumentCountText] = useState("");
  const [messageApi, messageContextHolder] = message.useMessage();

  /**
   * ドキュメントダウンロード処理を行うイベントハンドラー
   * @param {Event} e - クリックイベントオブジェクト
   * @param {Object} documentItem - ダウンロード対象のドキュメントデータ
   */
  const handleDocumentDownload = useCallback((e, documentItem) => {
    e.stopPropagation();
    apiService.getDocumentsDownload(selectedCollectionName, documentItem.uuid);
  }, [selectedCollectionName]);

  /**
   * カテゴリービューのツリーデータを生成する
   *
   * @param {[]} documents - ドキュメントデータの配列
   * @returns {[]} - ツリーデータの配列
   */
  const generateCategoryViewTree = useCallback((documents = []) => {
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
  }, [handleDocumentDownload]);

  /**
   * タグビューのツリーデータを生成する
   *
   * @param {[]} documents - ドキュメントデータの配列
   * @returns {[]} - ツリーデータの配列
   */
  const generateTagViewTree = useCallback((documents = []) => {
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

    const collections = statusService.getSnapshot("@Collections") || [];
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
          key: buildTagKey(tag, documentItem.uuid),
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
  }, [selectedCollectionName, handleDocumentDownload]);

  /**
   * 類似度ビューのツリーデータを生成する（フラット）
   * @param {[]} documents
   * @returns {[]} flat tree sorted by similarity desc
   */
  const generateSimilarityViewTree = useCallback((documents = []) => {
    const docs = Array.isArray(documents) ? documents.slice() : [];
    docs.sort((a, b) => (b.similarity ?? -Infinity) - (a.similarity ?? -Infinity));
    return docs.map((documentItem) => {
      const filePathSegments = splitFilePath(documentItem.file_path);
      const fileName = filePathSegments.at(-1);
      return {
        title: fileName,
        key: documentItem.uuid,
        icon: (
          <DownloadOutlined
            title="download"
            onClick={(e) => handleDocumentDownload(e, documentItem)}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1677ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "unset")}
          />
        ),
        similarity: documentItem.similarity ?? 0,
        keywords: documentItem.keywords,
        summary: documentItem.summary,
        tags: documentItem.tags,
      };
    });
  }, [handleDocumentDownload]);

  /**
   * 葉ノードのキーをすべて取得する
   *
   * @param {[]} tree - ツリーデータの配列
   * @param {[]} keys - 再帰的に収集されたキーの配列（初回は空配列を渡す）
   * @returns {[]} - 葉ノードのキーの配列
   */
  const getLeafKeys = useCallback((tree, keys = []) => {
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
  }, []);

  /**
   * 葉ノード以外のノードのキーの配列を取得する
   *
   * @param {[]} tree - ツリーデータの配列
   * @returns {[]} - 葉ノード以外のノードのキーの配列
   */
  const getNonLeafKeys = useCallback((tree) => {
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
  }, []);

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
              <Divider orientation="left" orientationMargin="0" plain>
                <span>keywords</span>
              </Divider>
              <p>{node.keywords?.join(",")}</p>
              <Divider orientation="left" orientationMargin="0" plain>
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
  const onCheck = (selectedKeysFromEvent) => {
    // Tree から来るキー列を UUID に変換して state に保存する
    const uuids = Array.from(
      new Set(selectedKeysFromEvent.map((k) => extractUuidFromKey(k)))
    );
    setSelectedKeys(uuids);
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

    const trees = {
      Category: categoryTree,
      Tag: tagTree,
      Similarity: similarityTree,
    };
    const tree = trees[activeViewName];
    const keys = getKeysAboveThreshold(tree, similarity);
    // keys は view によって tag::uuid か uuid の可能性があるため UUID に正規化して保存
    const uuids = Array.from(new Set(keys.map((k) => extractUuidFromKey(k))));
    setSelectedKeys(uuids);
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
      const similarityTreeMap = indexNodesByKey(similarityTree);
      const documents = statusService.getSnapshot("@Documents");
      const documentsMap = new Map(documents.map((d) => [d.uuid, d]));

      let maxSimilarity = 0;
      const uuids = [];

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
        // 類似度ビューの更新
        const similarityItem = similarityTreeMap.get(uuid);
        if (similarityItem) {
          similarityItem.similarity = similarity;
        }
        // update currentDocuments
        const document = documentsMap.get(uuid);
        if (document) {
          document.similarity = similarity;
        }
        uuids.push(uuid);
      }
      // @TopNSimilarityDocuments のステータスを更新
      statusService.patchStatus(
        "@TopNSimilarityDocuments",
        sortTreeBySimilarity(documents).slice(0, 3)
      );

      const sortedcategoryTree = sortTreeBySimilarity(categoryTree);
      setCategoryTree(sortedcategoryTree);

      const sortedTagTree = sortTreeBySimilarity(tagTree);
      setTagTree(sortedTagTree);

      const sortedSimilarityTree = sortTreeBySimilarity(similarityTree);
      setSimilarityTree(sortedSimilarityTree);

      setSelectedKeys(uuids);
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

  // selectedCollectionName の変更を監視する
  useEffect(() => {
    const selectedCollectionNameSubscription = statusService
      .getStatus$("@SelectedCollectionName")
      .subscribe((collectionName) => {
        setSelectedCollectionName(collectionName);
      });
    return () => {
      selectedCollectionNameSubscription.unsubscribe();
    };
  }, []);

  // Chat などの外部コンポーネントからの SelectedKeys 更新を監視する
  useEffect(() => {
    const selectedKeysSubscription = statusService
      .getStatus$("@SelectedKeys")
      .subscribe((keys) => {
        if (!keys) {
          return;
        }
        const uuids = [...new Set(keys.map((k) => extractUuidFromKey(k)))];
        setSelectedKeys(uuids);
    });
    return () => selectedKeysSubscription.unsubscribe();
  }, []);

  // selectedCollectionName が変更されたらドキュメントデータを取得する
  useEffect(() => {
    const fetchFolderData = async () => {
      setIsFetching(true);
      try {
        const response = await apiService.getDocuments(selectedCollectionName);
        statusService.patchStatus("@Documents", response["documents"]);
        setCategoryTree(generateCategoryViewTree(response["documents"]));
        setTagTree(generateTagViewTree(response["documents"]));
        setSimilarityTree(generateSimilarityViewTree(response["documents"]));
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
  }, [selectedCollectionName,
      generateCategoryViewTree,
      generateTagViewTree,
      generateSimilarityViewTree,
      messageApi]);

  // アクティブなビューが変更されたらツリーデータと選択状態を更新する
  useEffect(() => {
    const trees = {
      Category: categoryTree,
      Tag: tagTree,
      Similarity: similarityTree,
    };
    const viewTree = trees[activeViewName] || [];

    // ビューの更新
    setTreeData(viewTree);
    const viewIndex = indexNodesByKey(viewTree);
    // expandedKeys は viewTree に実際に存在するノードのみを設定
    setExpandedKeys(getNonLeafKeys(viewTree).filter((k) => viewIndex.has(k)));
  }, [activeViewName, categoryTree, tagTree, similarityTree, getNonLeafKeys]);

  // Tree に渡す checkedKeys を現在の treeData の葉ノードに存在するキーだけで計算する
  const checkedKeysForTree = useMemo(() => {
    if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
      return [];
    }
    const leafKeys = getLeafKeys(treeData);
    const uuids = new Set(selectedKeys.map((k) => extractUuidFromKey(k)));
    const matched = [];
    for (const key of leafKeys) {
      if (uuids.has(extractUuidFromKey(key))) {
        matched.push(key);
      }
    }
    return matched;
  }, [selectedKeys, treeData, getLeafKeys]);

  // 選択済みドキュメントのキーと数を更新する
  useEffect(() => {
    // 選択済みドキュメントのキーをステータスに保存
    statusService.patchStatus("@SelectedKeys", selectedKeys);

    // 選択済みドキュメント数の更新
    const selectedDocumentCount = new Set(
      selectedKeys.map((key) => extractUuidFromKey(key))
    ).size;
    setSelectedDocumentCountText(
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

       {/* ドキュメント選択のクエリの入力欄 */}
        <Flex justify="center" className={style.queryBox_con}>
          <Flex className={style.textarea_con} vertical>
            <Input.TextArea
              value={selectionQuery}
              variant="borderless"
              placeholder="send a query to select documents..."
              onKeyDown={handleSelectionQueryKeyDown}
              onChange={(e) => setSelectionQuery(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 10 }}
            />
            <Flex justify="right">
              <Button
                type="default"
                loading={isFetching}
                onClick={submitSelectionQuery}
                icon={<SendOutlined style={{ transform: "rotate(270deg)" }} />}
              />
            </Flex>
          </Flex>
        </Flex>

        {/* 類似度スライダー */}
        <Flex gap="small" justify="space-between" style={{ width: "100%" }}>
          {/* <Typography.Title level={5}>Similarity</Typography.Title> */}
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

        {/* ドキュメント一覧 */}
        <Tabs
          defaultActiveKey="Category"
          centered
          style={{ width: "100%" }}
          value={activeViewName}
          // tabBarExtraContent={selectedCountBadge}
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
            {
              key: "Similarity",
              label: "Similarity View",
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
              checkedKeys={checkedKeysForTree}
              onCheck={onCheck}
            />
          </Spin>
        </div>

        {/* 選択ドキュメント数を表示 */}
        <Flex
          justify="flex-end"
          style={{ width: "100%", alignItems: "center", gap: "0.5rem" }}
        >
          <Typography.Text style={{ whiteSpace: "nowrap" }}>
            {selectedDocumentCountText}
          </Typography.Text>
        </Flex>
      </Flex>
    </>
  );
}
