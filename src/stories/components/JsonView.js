import React, { useState, useEffect } from "react";

import "./JsonView.scss";

const renderProperty = (name, expandable, expanded) => {};

const renderObject = (name, obj, depth, options) => (
  <span className="json_value json_object">
    <span>&#123;</span>
    {Object.keys(obj).map(key => (
      <JSONValue key={`${key}${depth}`} name={key} depth={depth + 1} value={obj[key]} />
    ))}
    <span>&#125;</span>
  </span>
);

const renderArray = (name, value, depth, options) => (
  <span className="json_value json_array">
    [
    <span>
      {value.map(v => (
        <JSONValue value={v} />
      ))}
    </span>
    ]
  </span>
);

const renderBasic = (name, value, depth, options) => {
  if (typeof value === "number") {
    return <span className="json_value json_number">{value}</span>;
  }
  if (typeof value === "string") {
    return <span className="json_value json_string">"{value}"</span>;
  }
  if (typeof value === "boolean") {
    return <span className="json_value json_boolean">{value ? "true" : "false"}</span>;
  }
  return null;
};

const JSONValue = ({ name, value, depth, options }) => {
  // &#34;{key}&#34;:&nbsp;
  const [expanded, setExpanded] = useState(true);
  if (Array.isArray(value)) {
    return renderArray(name, value, depth, { expandable: true, expanded, setExpanded });
  }
  if (typeof value === "object") {
    return renderObject(name, value, depth, { expandable: true, expanded, setExpanded });
  }
  return renderBasic(name, value, depth);
  // return <pre>{JSON.stringify(json, null, 2)}</pre>;
};

const JsonView = ({ value, options }) => (
  <span className="json">
    <JSONValue value={value} options={options} />
  </span>
);

export default JsonView;
