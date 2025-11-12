/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { useEffect, useState } from "react";

export default function useSessionModal(key) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasValue = window.sessionStorage.getItem(key);
    if (!hasValue) {
      setVisible(true);
    }
  }, [key]);

  const confirm = () => {
    window.sessionStorage.setItem(key, "true");
    setVisible(false);
  };

  return [visible, confirm];
}
