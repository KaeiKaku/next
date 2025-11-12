/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import "./App.css";
import "@ant-design/v5-patch-for-react-19";
import { App } from "antd";
import Home from "@/components/Home";

/*
 * メインの UI アプリコンポーネント
 *
 * @component
 * @return {JSX.Element} UI アプリコンポーネント (ルートの要素)
 */
function UiApp() {
  return (
    <>
      <App>
        <Home />
      </App>
    </>
  );
}

export default UiApp;
