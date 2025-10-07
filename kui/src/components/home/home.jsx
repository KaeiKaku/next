import { useState } from "react";
import { Flex, Splitter } from "antd";
import Header from "@/components/header/header";
import DocumentCollection from "@/components/documentCollection/documentCollection";
import FolderCollection from "@/components/folderCollection/folderCollection";
import Chat from "@/components/chat/chat";

export default function Home() {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedFile, setSelectedFile] = useState([]);

  return (
    <>
      <Header />
      <Splitter style={{ height: `calc(100vh - var(--header-height))` }}>
        <Splitter.Panel defaultSize="30%" min="20%" max="50%">
          <Flex vertical style={{ height: "100%" }}>
            <DocumentCollection onChange={setSelectedCollection} />
            <FolderCollection
              onChange={setSelectedFile}
              selectedCollection={selectedCollection}
            />
          </Flex>
        </Splitter.Panel>
        <Splitter.Panel>
          <Flex vertical style={{ height: "100%" }}>
            <Chat
              selectedCollection={selectedCollection}
              selectedFile={selectedFile}
            />
          </Flex>
        </Splitter.Panel>
      </Splitter>
    </>
  );
}
