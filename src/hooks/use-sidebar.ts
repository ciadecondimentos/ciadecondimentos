import { useState, useEffect } from "react";

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    // Dispatch a custom event to notify other components (like layouts)
    window.dispatchEvent(new Event("sidebar-state-change"));
  }, [isCollapsed]);

  const toggle = () => setIsCollapsed((prev) => !prev);

  return { isCollapsed, toggle };
}
