/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import "./App.css";
import "@ant-design/v5-patch-for-react-19";
import { App } from "antd";
import Home from "@/components/home/home";
// import SessionModal from "@/components/sessionModal/sessionModal";
// import useSessionModal from "@/hook/useSessionModal";

/*
 * メインの UI アプリコンポーネント
 *
 * @component
 * @return {JSX.Element} UI アプリコンポーネント (ルートの要素)
 */
function UiApp() {
  // const [showIntro, confirmIntro] = useSessionModal("hasSeenIntro");
  return (
    <>
      {/* <SessionModal visible={showIntro} onConfirm={confirmIntro}></SessionModal> */}
      <App>
        <Home />
      </App>
    </>
  );
}

export default UiApp;
