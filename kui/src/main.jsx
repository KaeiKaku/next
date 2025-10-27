// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@ant-design/v5-patch-for-react-19";
import UiApp from "./App.jsx";
import "@/status/status.js";

createRoot(document.getElementById("root")).render(<UiApp />);
