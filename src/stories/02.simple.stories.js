import React from "react";
import { createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import { reduxForm, reducer as formReducer } from "redux-form";
import Immutable from "immutable";
import SchemaForm from "../index";

import "./bootstrap.scss";

export default {
  title: "SchemaForm"
};

const store = createStore(
  combineReducers({
    form: formReducer
  })
);

export const withSimpleExample = () => {
  const schema = Immutable.fromJS({
    type: "object",
    title: "A Simple form",
    properties: {
      name: {
        type: "string",
        description: "Your name",
        minLength: 1
      },
      email: {
        type: "string",
        format: "email",
        description: "Your email address",
        minLength: 1
      }
    },
    required: ["name", "email"]
  });
  const config = {};

  const ExampleSchemaForm = () => <SchemaForm schema={schema} config={config} />;

  const ConnectedExampleSchemaForm = reduxForm({
    form: "example",
    initialValues: {}
  })(ExampleSchemaForm);

  return (
    <Provider store={store}>
      <ConnectedExampleSchemaForm />
    </Provider>
  );
};
