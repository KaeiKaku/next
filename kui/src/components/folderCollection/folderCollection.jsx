import { useState, useEffect } from "react";
import { Flex, Typography, Input, Button, Tree } from "antd";
import { statusService } from "@/status/status";

const { TextArea } = Input;
const { DirectoryTree } = Tree;
// const treeData = [
//   {
//     title: "0-0",
//     key: "0-0",
//     children: [
//       {
//         title: "0-0-0",
//         key: "0-0-0",
//         children: [
//           { title: "0-0-0-0", key: "0-0-0-0" },
//           { title: "0-0-0-1", key: "0-0-0-1" },
//           { title: "0-0-0-2", key: "0-0-0-2" },
//         ],
//       },
//       {
//         title: "0-0-1",
//         key: "0-0-1",
//         children: [
//           { title: "0-0-1-0", key: "0-0-1-0" },
//           { title: "0-0-1-1", key: "0-0-1-1" },
//           { title: "0-0-1-2", key: "0-0-1-2" },
//         ],
//       },
//       {
//         title: "0-0-2",
//         key: "0-0-2",
//       },
//     ],
//   },
//   {
//     title: "0-1",
//     key: "0-1",
//     children: [
//       { title: "0-1-0-0", key: "0-1-0-0" },
//       { title: "0-1-0-1", key: "0-1-0-1" },
//       { title: "0-1-0-2", key: "0-1-0-2" },
//     ],
//   },
//   {
//     title: "0-2",
//     key: "0-2",
//   },
// ];

export default function folderCollection() {
  const [selectrion_query, setSelectionValue] = useState();
  const [selectedCollection, setSelectedCollection] = useState();
  const [folder_tree, setFolderTree] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState(["0-0-0", "0-0-1"]);
  const [checkedKeys, setCheckedKeys] = useState();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // const onExpand = (expandedKeysValue) => {
  //   console.log("onExpand", expandedKeysValue);
  //   // if not set autoExpandParent to false, if children expanded, parent can not collapse.
  //   // or, you can remove all expanded children keys.
  //   setExpandedKeys(expandedKeysValue);
  //   setAutoExpandParent(false);
  // };
  const onCheck = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue);
    statusService.patchStatus("fileCollection", checkedKeysValue);
  };
  // const onSelect = (selectedKeysValue, info) => {
  //   console.log("onSelect", info);
  //   setSelectedKeys(selectedKeysValue);
  // };

  const handlePost = async () => {
    if (!selectedCollection || !selectrion_query) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/select/${encodeURIComponent(
          selectedCollection
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: selectrion_query,
            threshold: 0.1,
            top_n: 100,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const new_folder_tree = [];

      result["selected_documents"].forEach((datum) => {
        new_folder_tree.push({
          title: datum.file_path,
          key: datum.uuid,
        });
      });

      setFolderTree(new_folder_tree);
    } catch (error) {
      console.error("error:", error);
    }
  };

  useEffect(() => {
    const documentCollection$ = statusService.getStatus$("documentCollection");

    const docSub = documentCollection$.subscribe((_selectedCollection) => {
      setSelectedCollection(_selectedCollection.join());
    });

    return () => docSub.unsubscribe();
  }, []);

  return (
    <>
      <Flex
        justify="flex-start"
        align="flex-start"
        style={{ padding: "1rem", overflow: "overlay" }}
        flex={1}
        vertical
      >
        <Typography.Title level={4}>Selection Query</Typography.Title>
        <TextArea
          value={selectrion_query}
          onChange={(e) => setSelectionValue(e.target.value)}
          placeholder="send a message..."
          autoSize={{ minRows: 3, maxRows: 10 }}
        />
        <Flex justify="flex-end" style={{ width: "100%", marginTop: "0.5rem" }}>
          <Button type="primary" onClick={handlePost}>
            Submit
          </Button>
        </Flex>
        <DirectoryTree
          checkable
          showLine
          defaultExpandAll
          onCheck={onCheck}
          treeData={folder_tree}
        />
      </Flex>
    </>
  );
}
