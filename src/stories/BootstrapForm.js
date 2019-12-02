/* eslint-disable react/prop-types */
import React from "react";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { reduxForm, reducer as formReducer } from "redux-form";
import SchemaForm from "../index";

import "./bootstrap.scss";
import JsonView from "./components/JsonView";

const store = createStore(
  combineReducers({
    form: formReducer
  })
);

const BootstrapSchemaForm = props => {
  const TheSchemaForm = props2 => (
    <div>
      <SchemaForm
        {...props2}
        schema={props.schema}
        config={
          props.config || {
            // add * after label text
            showRequired: true,
            // use i18next instance
            // t,
            // bs4
            groupClass: "form-group row",
            groupErrorClass: "has-danger",
            groupSuccessClass: "has-success",
            labelClass: "col-sm-4 col-12 form-control-label col-form-label",
            inputWrapperClass: "col-sm-8 col-12",
            inputClass: "form-control",
            inputStaticClass: "form-control form-control-static",
            inputErrorClass: "",
            inputSuccessClass: "",
            radioGroupInlineClass: "radio-inline",
            checkboxGroupInlineClass: "checkbox-inline",
            buttonWrapperClass: "offset-sm-4 col-sm-8 col-12",
            buttons: {
              submit: {
                className: "btn btn-primary mr-2",
                disabled: props2.submitting || props2.pristine,
                onClick: props2.handleSubmit(() => {}),
                text: (
                  <span>
                    <i className={`fa fa-fw ${props2.submitting ? "fa-refresh fa-spin" : "fa-save"}`} />
                    &nbsp;Submit
                  </span>
                )
              },
              reset: {
                className: "btn btn-secondary",
                disabled: props2.submitting || props2.pristine,
                onClick: props2.reset,
                text: (
                  <span>
                    <i className="fa fa-fw fa-undo" />
                    &nbsp;Reset
                  </span>
                )
              }
            }
          }
        }
      />
      <hr />
      <div>
        <strong>Schema</strong>
        <br />
        <JsonView json={props.schema.toJS()} />
      </div>
    </div>
  );

  const ConnectedReduxForm = reduxForm({
    form: "example",
    initialValues: {}
  })(TheSchemaForm);

  return (
    <Provider store={store}>
      <ConnectedReduxForm />
    </Provider>
  );
};

export default BootstrapSchemaForm;
