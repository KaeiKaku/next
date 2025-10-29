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
  Select,
} from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";

const { TextArea } = Input;
const { DirectoryTree } = Tree;

export default function folderCollection() {
  const [fetchingFolder, setFetchingFolder] = useState(false);
  const [selectrionQuery, setSelectionValue] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [categoryTree, setCategoryTree] = useState([]);
  const [tagTree, setTagTree] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [tabValue, setTabValue] = useState("Category");
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [inputValueSim, setInputValueSim] = useState(0);
  const [promptLibrary, setPromptLibrary] = useState([]);

  const genTreeCategory = (data) => {
    const root = [];

    function addPath(tree, parts, datum) {
      if (!parts.length) return;
      const title = parts[0];
      let existing = tree.find((item) => item.title === title);
      if (!existing) {
        const isLeaf = parts.length === 1;
        existing = {
          title,
          key: isLeaf ? datum.uuid : title,
          ...(isLeaf && {
            similarity: 0,
            keywords: datum.keywords,
            summary: datum.summary,
            tags: datum.tags,
          }),
        };
        tree.push(existing);
      }
      if (parts.length > 1) {
        if (!existing.children) existing.children = [];
        addPath(existing.children, parts.slice(1), datum);
      }
    }

    data.forEach((datum) => {
      const parts = datum.file_path.trim().split("\\");
      addPath(root, parts, datum);
    });

    return root;
  };

  const genTreeTags = (data = []) => {
    const collections = statusService.getSnapshot("collections") || [];
    const current = collections.find(
      (c) => c.collection_name === selectedCollection
    );
    if (!current || !Array.isArray(current.tags)) return [];

    const tagMap = {};
    for (const datum of data) {
      if (!Array.isArray(datum.tags)) continue;
      const parts = datum.file_path.split(/[/\\]/);
      const fileName = parts[parts.length - 1];
      for (const tag of datum.tags) {
        (tagMap[tag] ||= []).push({
          title: fileName,
          key: `${tag}_${datum.uuid}`,
          keywords: datum.keywords,
          summary: datum.summary,
          similarity: 0,
        });
      }
    }

    const tagTree = current.tags
      .map((tag) => ({
        title: tag,
        key: tag,
        children: tagMap[tag] || [],
      }))
      .filter((node) => node.children.length > 0);

    return tagTree;
  };

  const getAllLeafKeys = (treeNodes) => {
    let keys = [];

    treeNodes.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        keys.push(node.key);
      } else {
        keys = keys.concat(getAllLeafKeys(node.children));
      }
    });

    return keys;
  };

  const getAllParentKeys = (treeNodes) => {
    let keys = [];
    treeNodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.push(node.key);
        keys = keys.concat(getAllParentKeys(node.children));
      }
    });
    return keys;
  };

  const sortTreeBySimilarity = (nodes, order = "desc") => {
    if (!Array.isArray(nodes)) return nodes;

    const compare = (a, b) => {
      const sa = a.similarity ?? -Infinity;
      const sb = b.similarity ?? -Infinity;
      return order === "asc" ? sa - sb : sb - sa;
    };

    return nodes
      .map((node) => ({
        ...node,
        children: sortTreeBySimilarity(node.children, order),
      }))
      .sort(compare);
  };

  const buildNodeMap = (tree) => {
    const map = new Map();

    function traverse(nodes) {
      nodes.forEach((node) => {
        map.set(node.key, node);
        if (node.children) traverse(node.children);
      });
    }

    traverse(tree);
    return map;
  };

  const getCheckedKeysBySimilarity = (tree, threshold) => {
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
        <span>
          <small style={{ marginRight: "0.5rem" }}>
            <i>{(Math.trunc(node.similarity * 1000) / 1000).toFixed(3)}</i>
          </small>
          {node.title}
        </span>
      </Popover>
    );
  };

  const onCheck = (checkedKeysFromEvent, info) => {
    let finalCheckedKeys = [];

    if (tabValue === "Tag") {
      const leafKeys = getAllLeafKeys(tagTree);
      const nodeSuffix = info.node.key.split("_").pop();

      const matchedLeafKeys = leafKeys.filter((k) => k.endsWith(nodeSuffix));

      if (info.checked) {
        finalCheckedKeys = [
          ...new Set([...checkedKeysFromEvent, ...matchedLeafKeys]),
        ];
      } else {
        finalCheckedKeys = checkedKeysFromEvent.filter(
          (k) => !matchedLeafKeys.includes(k)
        );
      }

      finalCheckedKeys = finalCheckedKeys.filter((k) => leafKeys.includes(k));
    } else if (tabValue === "Category") {
      const leafKeys = getAllLeafKeys(categoryTree);
      finalCheckedKeys = checkedKeysFromEvent.filter((k) =>
        leafKeys.includes(k)
      );
    }

    setCheckedKeys(finalCheckedKeys);
  };

  const onChangeSim = (inputValueSim) => {
    if (Number.isNaN(inputValueSim)) {
      return;
    }
    setInputValueSim(inputValueSim);
  };

  const onChangeCompleteSim = (inputValueSim) => {
    setInputValueSim(inputValueSim);

    const treeData = tabValue === "Tag" ? tagTree : categoryTree;

    const checkedKeysSim = getCheckedKeysBySimilarity(treeData, inputValueSim);

    setCheckedKeys(checkedKeysSim);
  };

  const handlePost = async () => {
    if (!selectedCollection || !selectrionQuery.trim()) return;
    setFetchingFolder(true);

    const response = await apiService.postSelectDocuments(selectedCollection, {
      query: selectrionQuery,
    });

    const categoryMap = buildNodeMap(categoryTree);
    const tagMap = buildNodeMap(tagTree);
    const uuid_list = response.selected_documents.map((doc) => {
      const { uuid, _, similarity } = doc;
      // update categoryMap
      const categoryItem = categoryMap.get(uuid);
      if (categoryItem) {
        categoryItem.similarity = similarity;
      }
      // update tagMap
      for (const [key, node] of tagMap) {
        if (key.endsWith(`_${uuid}`)) {
          node.similarity = similarity;
        }
      }

      return uuid;
    });

    console.log(tagTree);

    const sortedcategoryTree = sortTreeBySimilarity(categoryTree);
    const sortedTagTree = sortTreeBySimilarity(tagTree);

    setCategoryTree(sortedcategoryTree);
    setTagTree(sortedTagTree);
    setCheckedKeys(uuid_list);
    onChangeCompleteSim(0.9);
    setFetchingFolder(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  const handleChange = (value) => {
    if (!value) return;
    statusService.patchStatus("predefinedPrompt", value);
  };

  useEffect(() => {
    const docSub = statusService
      .getStatus$("documentCollection")
      .subscribe((_selectedCollection) => {
        setSelectedCollection(_selectedCollection);
      });

    return () => {
      docSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchFolderData = async () => {
      setFetchingFolder(true);

      const response = await apiService.getDocuments(selectedCollection);

      // update categoryMap
      setCategoryTree(genTreeCategory(response["documents"]));
      // update tagMap
      setTagTree(genTreeTags(response["documents"]));

      const promptLibrary =
        statusService
          .getSnapshot("collections")
          .find((c) => c.collection_name === selectedCollection)
          ?.prompts?.map((p) => ({ value: p, label: p })) ?? [];
      setPromptLibrary(promptLibrary);

      setFetchingFolder(false);
    };

    if (selectedCollection) {
      fetchFolderData();
    }
  }, [selectedCollection]);

  useEffect(() => {
    const map = {
      Category: categoryTree,
      Tag: tagTree,
    };
    setTreeData(map[tabValue] || []);
    setExpandedKeys(getAllParentKeys(map[tabValue]));
    if (checkedKeys.length === 0) return;

    const categoryKeys = [
      ...new Set(checkedKeys.map((k) => k.split("_").pop())),
    ];

    const finalKeys =
      tabValue === "Tag"
        ? [
            ...new Set(
              categoryKeys.flatMap((k) =>
                getAllLeafKeys(tagTree).filter((tagK) => tagK.endsWith(k))
              )
            ),
          ]
        : categoryKeys;

    setCheckedKeys(finalKeys);
  }, [tabValue, categoryTree, tagTree]);

  useEffect(() => {
    statusService.patchStatus("fileCollection", checkedKeys);
  }, [checkedKeys]);

  return (
    <>
      <Flex
        justify="flex-start"
        align="flex-start"
        style={{ padding: "1rem", overflow: "hidden" }}
        flex={1}
        vertical
        gap={"small"}
      >
        <Typography.Title level={4}>Selection Query</Typography.Title>
        <TextArea
          value={selectrionQuery}
          placeholder="send a message..."
          onKeyDown={handleKeyDown}
          onChange={(e) => setSelectionValue(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
        />
        <Flex justify="flex-end" style={{ width: "100%" }}>
          <Button
            type="primary"
            onClick={handlePost}
            loading={fetchingFolder ? { icon: <SyncOutlined spin /> } : null}
          >
            Submit
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
            onChange={onChangeSim}
            step={0.01}
            onChangeComplete={onChangeCompleteSim}
          />
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            onChange={onChangeCompleteSim}
            disabled={treeData.length === 0}
            value={inputValueSim}
          />
        </Flex>
        <Tabs
          defaultActiveKey="Category"
          centered
          style={{ width: "100%" }}
          value={tabValue}
          onChange={(value) => setTabValue(value)}
          items={[
            {
              key: "Category",
              label: "Category",
            },
            {
              key: "Tag",
              label: "Tag",
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
            spinning={fetchingFolder}
            style={{
              position: "relative",
            }}
          >
            <DirectoryTree
              checkable
              showLine
              selectable={false}
              treeData={treeData}
              expandedKeys={expandedKeys}
              titleRender={(node) => renderTitle(node)}
              checkedKeys={checkedKeys}
              onCheck={onCheck}
            />
          </Spin>
        </div>
        <Flex
          style={{
            width: "100%",
            height: "50px",
          }}
          align="center"
          justify="center"
          z-index={2}
        >
          <Select
            allowClear
            placeholder="Prompt Library"
            options={promptLibrary}
            onChange={handleChange}
            style={{ flex: 1 }}
          />
        </Flex>
      </Flex>
    </>
  );
}
