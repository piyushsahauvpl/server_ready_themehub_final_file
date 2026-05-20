import React, { Children, isValidElement, useEffect } from "react";

export function Helmet({ children }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === "title") {
        document.title = Children.toArray(child.props.children).join("");
        return;
      }

      if (child.type !== "meta") return;

      const { name, property, content } = child.props;
      const key = name ? `name="${name}"` : property ? `property="${property}"` : "";
      if (!key) return;

      let meta = document.head.querySelector(`meta[${key}]`);
      if (!meta) {
        meta = document.createElement("meta");
        if (name) meta.setAttribute("name", name);
        if (property) meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", content || "");
    });
  }, [children]);

  return null;
}
