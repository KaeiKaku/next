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
  Space,
} from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";

const { TextArea } = Input;
const { DirectoryTree } = Tree;

const items = [
  {
    key: "Category",
    label: "Category",
  },
  {
    key: "Tag",
    label: "Tag",
  },
];

const treeData = [
  {
    title: "0-0",
    key: "0-0",
    children: [
      {
        title: "0-0-0",
        key: "0-0-0",
        children: [
          { title: "0-0-0-0", key: "0-0-0-0" },
          { title: "0-0-0-1", key: "0-0-0-1" },
          { title: "0-0-0-2", key: "0-0-0-2" },
        ],
      },
      {
        title: "0-0-1",
        key: "0-0-1",
        children: [
          { title: "0-0-1-0", key: "0-0-1-0" },
          { title: "0-0-1-1", key: "0-0-1-1" },
          { title: "0-0-1-2", key: "0-0-1-2" },
        ],
      },
      {
        title: "0-0-2",
        key: "0-0-2",
      },
    ],
  },
  {
    title: "0-1",
    key: "0-1",
    children: [
      { title: "0-1-0-0", key: "0-1-0-0" },
      { title: "0-1-0-1", key: "0-1-0-1" },
      { title: "0-1-0-2", key: "0-1-0-2" },
    ],
  },
  {
    title: "0-2",
    key: "0-2",
  },
  {
    title: "0-3",
    key: "0-3",
  },
  {
    title: "0-4",
    key: "0-4",
  },
  {
    title: "0-5",
    key: "0-5",
  },
  {
    title: "0-6",
    key: "0-6",
  },
  {
    title: "0-7",
    key: "0-7",
  },
  { title: "0-8", key: "0-8" },
  { title: "0-9", key: "0-9" },
  { title: "0-10", key: "0-10" },
  { title: "0-11", key: "0-11" },
  { title: "0-12", key: "0-12" },
  { title: "0-13", key: "0-13" },
  { title: "0-14", key: "0-14" },
  { title: "0-15", key: "0-15" },
  { title: "0-16", key: "0-16" },
  { title: "0-17", key: "0-17" },
  { title: "0-18", key: "0-18" },
  { title: "0-19", key: "0-19" },
  { title: "0-20", key: "0-20" },
];

export default function folderCollection() {
  const [fetchingFolder, setFetchingFolder] = useState(false);
  const [selectrionQuery, setSelectionValue] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [folderTree, setFolderTree] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState();
  const [inputValueSim, setInputValueSim] = useState(0);

  const genTree = (data) => {
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

  const sortTreeBySimilarity = (data, order = "desc") => {
    const compare = (a, b) => {
      const sa = a.similarity ?? -Infinity;
      const sb = b.similarity ?? -Infinity;
      return order === "asc" ? sa - sb : sb - sa;
    };

    return data
      .map((node) => {
        if (node.children && Array.isArray(node.children)) {
          return {
            ...node,
            children: sortTreeBySimilarity(node.children, order),
          };
        }
        return node;
      })
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

  const onCheck = (checked_uuid_list) => {
    setCheckedKeys(checked_uuid_list);
  };

  const onChangeSim = (inputValueSim) => {
    if (Number.isNaN(inputValueSim)) {
      return;
    }
    setInputValueSim(inputValueSim);
  };

  const onChangeCompleteSim = (inputValueSim) => {
    setInputValueSim(inputValueSim);
    const checkedKeysSim = getCheckedKeysBySimilarity(
      folderTree,
      inputValueSim
    );
    setCheckedKeys(checkedKeysSim);
  };

  const handlePost = async () => {
    if (!selectedCollection || !selectrionQuery.trim()) return;
    setFetchingFolder(true);

    const response = await apiService.postSelectDocuments(selectedCollection, {
      query: selectrionQuery,
    });

    const folderMap = buildNodeMap(folderTree);
    const uuid_list = response.selected_documents.map((doc) => {
      const folder = folderMap.get(doc.uuid);
      if (folder) {
        folder.similarity = doc.similarity;
      }
      return doc.uuid;
    });

    const sortedTree = sortTreeBySimilarity(folderTree);

    setFolderTree(sortedTree);
    setCheckedKeys(uuid_list);
    setFetchingFolder(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  useEffect(() => {
    const documentCollection$ = statusService.getStatus$("documentCollection");
    const docSub = documentCollection$.subscribe((_selectedCollection) => {
      setSelectedCollection(_selectedCollection);
    });

    const documents$ = statusService.getStatus$("documents");
    const documentsSub = documents$.subscribe((_documents) => {
      console.log(`documents: `);
      console.log(_documents);
    });

    const collections$ = statusService.getStatus$("collections");
    const collectionsSub = collections$.subscribe((_collections) => {
      console.log(`collections: `);
      console.log(_collections);
    });

    return () => {
      docSub.unsubscribe();
      documentsSub.unsubscribe();
      collectionsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchFolderData = async () => {
      setFetchingFolder(true);

      const response = await apiService.getDocuments(selectedCollection);

      genTree(response["documents"]);

      const new_folderTree = genTree(response["documents"]);
      statusService.patchStatus("documents", new_folderTree);
      setFolderTree(new_folderTree);
      setFetchingFolder(false);
    };

    if (selectedCollection) {
      fetchFolderData();
    }
  }, [selectedCollection]);

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
            disabled={folderTree.length === 0}
            onChange={onChangeSim}
            step={0.01}
            onChangeComplete={onChangeCompleteSim}
          />
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            onChange={onChangeCompleteSim}
            disabled={folderTree.length === 0}
            value={inputValueSim}
          />
        </Flex>
        <Tabs
          defaultActiveKey="1"
          centered
          items={items}
          style={{ width: "100%" }}
        />
        <div
          style={{
            width: "100%",
            flex: 1,
            overflow: "auto",
          }}
        >
          <Spin spinning={fetchingFolder}>
            {/* {folderTree.length > 0 && ( */}
            <DirectoryTree
              checkable
              showLine
              defaultExpandAll
              treeData={treeData}
              titleRender={(node) => renderTitle(node)}
              selectable={false}
              checkedKeys={checkedKeys}
              onCheck={onCheck}
            />
            {/* )} */}
          </Spin>
        </div>
        <Flex
          style={{
            width: "100%",
            height: "50px",
          }}
          alignContent="center"
          justify="center"
          z-index={2}
        >
          <Select
            allowClear
            placeholder="Prompt Library"
            options={[
              { value: "jack", label: "Jack" },
              { value: "lucy", label: "Lucy" },
              { value: "Yiminghe", label: "yiminghe" },
            ]}
            style={{ flex: 1 }}
          />
        </Flex>
      </Flex>
    </>
  );
}
