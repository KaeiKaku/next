import { useState, useEffect } from "react";
import {
  Flex,
  Typography,
  Input,
  Button,
  Tree,
  Spin,
  Col,
  InputNumber,
  Row,
  Slider,
  Popover,
  Divider,
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
  const [folderTree, setFolderTree] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState();
  const [inputValueSim, setInputValue] = useState(0);

  const renderTitle = (node) => {
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
              <p>{node.keywords.join(",")}</p>
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
        <span>{node.title}</span>
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
    setInputValue(inputValueSim);
  };

  const onChangeCompleteSim = (inputValueSim) => {
    setInputValue(inputValueSim);
    const checkedKeysSim = folderTree
      .filter((folder) => folder.similarity > inputValueSim)
      .map((folder) => folder.key);
    setCheckedKeys(checkedKeysSim);
  };

  const handlePost = async () => {
    if (!selectedCollection || !selectrionQuery.trim()) return;
    setFetchingFolder(true);

    const response = await apiService.postSelectDocuments(selectedCollection, {
      query: selectrionQuery,
    });

    const folderMap = new Map(folderTree.map((folder) => [folder.key, folder]));
    const uuid_list = response.selected_documents.map((doc) => {
      const folder = folderMap.get(doc.uuid);
      if (folder) {
        folder.similarity = doc.similarity;
      }
      return doc.uuid;
    });

    setFolderTree(Array.from(folderMap.values()));
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

    return () => docSub.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFolderData = async () => {
      setFetchingFolder(true);

      const response = await apiService.getDocuments(selectedCollection);

      const new_folderTree = [];
      response["documents"].forEach((datum) => {
        new_folderTree.push({
          title: datum.file_path,
          key: datum.uuid,
          similarity: undefined,
          keywords: datum.keywords,
          summary: datum.summary,
        });
      });

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
        style={{ padding: "1rem", overflow: "overlay" }}
        flex={1}
        vertical
      >
        <Typography.Title level={4}>Selection Query</Typography.Title>

        <TextArea
          value={selectrionQuery}
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
        <div style={{ width: "100%", marginTop: "1rem" }}>
          <Spin spinning={fetchingFolder}>
            <Flex gap="large" justify="space-between">
              <Typography.Title level={4}>similarity</Typography.Title>
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
            <DirectoryTree
              checkable
              showLine
              defaultExpandAll
              treeData={folderTree}
              titleRender={(node) => renderTitle(node)}
              selectable={false}
              checkedKeys={checkedKeys}
              onCheck={onCheck}
            />
          </Spin>
        </div>
      </Flex>
    </>
  );
}
