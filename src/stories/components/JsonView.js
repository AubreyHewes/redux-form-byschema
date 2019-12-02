import React from "react";

const renderObject = (obj, depth) => (
  <div className="json_object">
    <div>&#123;</div>
    {Object.keys(obj).map(key => (
      <div key={`${key}${depth}`} style={{ marginLeft: 10 }}>
        &#34;{key}&#34;: <JsonView depth={depth + 1} json={obj[key]} />
      </div>
    ))}
    <div>&#125;</div>
  </div>
);

const renderArray = arr => <div>Array</div>;

const JsonView = ({ json, depth = 1 }) => {
  if (typeof json === "object") {
    return renderObject(json, depth);
  }
  if (Array.isArray(json)) {
    return renderArray(json, depth);
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
