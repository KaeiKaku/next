import { useState, useEffect } from "react";
import { Flex, Typography, Input, Button, Tree, Spin } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { statusService } from "@/status/status";
import { apiService } from "@/service/api.service";

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

    const response = await apiService.postCollection(selectedCollection, {
      query: selectrion_query,
    });

    const uuid_list = response.selected_documents.map((_) => _.uuid);
    setCheckedKeys(uuid_list);
    statusService.patchStatus("fileCollection", uuid_list);
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

    return () => docSub.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFolderData = async () => {
      setFetchingFolder(true);

      const response = await apiService.getCollection(selectedCollection);

      const new_folder_tree = [];
      response["documents"].forEach((datum) => {
        new_folder_tree.push({
          title: datum.file_path,
          key: datum.uuid,
        });
      });

      setFolderTree(new_folder_tree);
      setFetchingFolder(false);
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
