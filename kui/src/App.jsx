import "./App.css";
import "@ant-design/v5-patch-for-react-19";
import { App } from "antd";
import Home from "@/components/home/home";
// import SessionModal from "@/components/sessionModal/sessionModal";
// import useSessionModal from "@/hook/useSessionModal";

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
