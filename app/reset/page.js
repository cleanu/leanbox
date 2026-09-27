"use client";

import { useEffect } from "react";

export default function ResetPage() {
  useEffect(() => {
    window.location.replace("/?reset=1");
  }, []);
  return null;
}
