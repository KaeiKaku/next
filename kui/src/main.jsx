/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import UiApp from "./App.jsx";
import "@/status/status.js";

createRoot(document.getElementById("root")).render(<UiApp />);
