import React from "react";

const JsonView = ({ json, depth = 1 }) => {
  if (typeof json === "object") {
    return [
      <div>&#123;</div>,
      Object.keys(json).map(key => (
        <div style={{ marginLeft: 10 }}>
          &#34;{key}&#34;: <JsonView depth={depth + 1} json={json[key]} />
        </div>
      )),
      <div>&#125;</div>
    ];
  }
  if (typeof json === "number") {
    return <div className="json_number">{json}</div>;
  }
  if (typeof json === "string") {
    return <div className="json_string">"{json}"</div>;
  }
  return "YO";
  // return <pre>{JSON.stringify(json, null, 2)}</pre>;
};

export default JsonView;
