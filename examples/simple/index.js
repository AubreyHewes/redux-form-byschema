// https://codesandbox.io/s/loving-wescoff-c3cre
import React from "react";
import { createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import { reduxForm, reducer as formReducer } from "redux-form";
import Immutable from "immutable";
import SchemaForm from "@hewes/redux-form-byschema";

const store = createStore(
  combineReducers({
    form: formReducer
  })
);

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

const ExampleSchemaForm = () => (
  <SchemaForm schema={schema} config={Immutable.Map()} />
);

const ConnectedExampleSchemaForm = reduxForm({
  form: "example"
})(ExampleSchemaForm);

const Example = () => (
  <Provider store={store}>
    <ConnectedExampleSchemaForm />
  </Provider>
);

export default Example;
