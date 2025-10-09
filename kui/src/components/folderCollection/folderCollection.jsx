import { useState, useEffect } from "react";
import { Flex, Typography, Input, Button, Tree, Spin } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";

const { TextArea } = Input;
const { DirectoryTree } = Tree;

export default function folderCollection() {
  const [fetchingFolder, setFetchingFolder] = useState(false);
  const [selectrion_query, setSelectionValue] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [folder_tree, setFolderTree] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState();

  const onCheck = (checked_uuid_list) => {
    setCheckedKeys(checked_uuid_list);
    statusService.patchStatus("fileCollection", checked_uuid_list);
  };

  const handlePost = async () => {
    if (!selectedCollection || !selectrion_query.trim()) return;
    setFetchingFolder(true);
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
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const uuid_list = result.selected_documents.map((_) => _.uuid);

      setCheckedKeys(uuid_list);
      statusService.patchStatus("fileCollection", uuid_list);
    } catch (error) {
      console.error("error:", error);
    } finally {
      setFetchingFolder(false);
    }
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

    return () => docSub.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFolderData = async () => {
      setFetchingFolder(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/documents/${encodeURIComponent(
            selectedCollection
          )}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        const new_folder_tree = [];

        result["documents"].forEach((datum) => {
          new_folder_tree.push({
            title: datum.file_path,
            key: datum.uuid,
          });
        });

        setFolderTree(new_folder_tree);
      } catch (error) {
        console.error("error:", error);
      } finally {
        setFetchingFolder(false);
      }
    };

    if (selectedCollection) {
      fetchFolderData();
    }
  }, [selectedCollection]);

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
          placeholder="send a message..."
          onKeyDown={handleKeyDown}
          onChange={(e) => setSelectionValue(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
        />
        <Flex justify="flex-end" style={{ width: "100%", marginTop: "0.5rem" }}>
          <Button
            type="primary"
            onClick={handlePost}
            loading={fetchingFolder ? { icon: <SyncOutlined spin /> } : null}
          >
            Submit
          </Button>
        </Flex>
        <Spin spinning={fetchingFolder}>
          <DirectoryTree
            checkable
            showLine
            defaultExpandAll
            selectable={false}
            checkedKeys={checkedKeys}
            onCheck={onCheck}
            treeData={folder_tree}
          />
        </Spin>
      </Flex>
    </>
  );
}
