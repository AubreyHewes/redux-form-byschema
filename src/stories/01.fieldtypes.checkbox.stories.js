/* eslint-disable react/prop-types */
import React from "react";
import Immutable from "immutable";

import BootstrapSchemaForm from "./BootstrapForm";

export default {
  title: "Field types|Checkbox"
};

export const Simple = () => {
  const schema = Immutable.fromJS({
    type: "object",
    title: "Form with a checkbox",
    properties: {
      checkbox: {
        type: "boolean",
        title: "Checkbox"
      }
    }
  });
  return <BootstrapSchemaForm schema={schema} />;
};

export const Required = () => {
  const schema = Immutable.fromJS({
    type: "object",
    title: "Form with a required checkbox",
    properties: {
      checkbox: {
        type: "boolean",
        title: "Checkbox"
      }
    },
    required: ["checkbox"]
  });
  return <BootstrapSchemaForm schema={schema} />;
};

export const WithNote = () => {
  const schema = Immutable.fromJS({
    type: "object",
    title: "Form with a checkbox that has a note",
    properties: {
      checkbox: {
        type: "boolean",
        title: "Checkbox",
        note: "This is the note"
      }
    }
  });
  return <BootstrapSchemaForm schema={schema} />;
};
