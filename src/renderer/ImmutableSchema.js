import React, { createElement } from "react";
import { Map as ImmutableMap, List as ImmutableList } from "immutable";
import { Field, FieldArray } from "redux-form";

/**
 * Renderer for a react-redux (v6) form via an Immutable JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default class Renderer {
  t = text => text;

  constructor(options) {
    this.t = options.t || this.t;
    if (!ImmutableMap.isMap(options)) {
      throw new Error("Options should be an immutable map!");
    }
    this.options = new ImmutableMap({
      path: []
    }).mergeDeep({ ...options, t: undefined });
  }

  getRef = (/*ref*/) => Promise.reject(new Error("Not implemented"));

  renderObject = (schema, path, data) => {
    // const chunkPromises = [];
    data = data || {};

    if (!schema.get("properties")) {
      if (schema.get("allOf") || schema.get("extends")) {
        return <fieldset key={path.concat("allOf").join("-") || "root"} />;
      }
      if (schema.get("oneOf")) {
        return this.renderOneOf(schema, path, data);
      }
      if (schema.get("$ref")) {
        return this.getRef(schema.get("$ref")).then(subSchema => {
          if (subSchema.get("properties")) {
            return this.renderObject(subSchema, path, data);
          } else {
            return this.renderChunk(path, subSchema, data);
          }
        });
      }

      // if (schema.get("type") && schema.get("type") === "array" && schema.get("items")) {
      //   chunkPromises.push(this.renderChunk(path, schema, data));
      // }
    }

    if (schema && schema.get("renderer") && this.options.get("renderers")) {
      // override renderer
      if (this.options.get("renderers").get(schema.get("renderer"))) {
        return this.options.get("renderers").get(schema.get("renderer"))({ schema, path, data }, this);
      }
    }

    const container = {
      key: path.join("-") || "root",
      disabled: schema.get("disabled"),
      children: []
    };

    if (schema.get("title")) {
      container.children.push(
        createElement("legend", {
          key: `${path}-legend`,
          className: "legend",
          children: schema.get("title")
        })
      );
    }

    if (schema.get("description")) {
      container.children.push(
        createElement("p", {
          key: `${path}-description`,
          children: schema.get("description")
        })
      );
    }

    if (schema.get("properties")) {
      schema.get("properties").map((propSchema, propName) => {
        if (
          schema.get("required") &&
          schema.get("required").findEntry &&
          schema.get("required").findEntry(prop => prop === propName)
        ) {
          if (propSchema.get("type") !== "object" || propSchema.get("oneOf")) {
            propSchema = propSchema.set("required", true);
          }
        }

        path.slice(0);
        path.push(propName);
        container.children.push(this.renderChunk(path, propSchema /*, data.get(propName) */));
      });
    }

    return createElement("fieldset", container);
  };

  /**
   * @TODO klevera
   *
   * @param {Object} schema
   * @param {Array} path
   * @param {Object} data
   *
   * @returns {*}
   */
  renderOneOf(schema, path, data) {
    const propName = "value";
    const id = (path.length ? `${path.join("-")}-` : "") + propName;

    const classNames = ["schema-property", "schema-property-oneOf"];
    if (this.options.get("groupClass") && schema.get("type") !== "object") {
      classNames.push(this.options.get("groupClass"));
    }

    const container = {
      key: path,
      className: classNames.join(" "),
      children: []
    };

    const me = this;
    const realPath = path;

    const oneOfs = schema.get("oneOf").filter(
      subSchema =>
        subSchema
          .get("properties")
          .get("value")
          .get("default") !== null
    );

    // console.log(schema.toJS());
    container.children.push(
      this.renderChunk(
        realPath.concat([propName]),
        new ImmutableMap({
          type: "string",
          title: schema.get("title"),
          name: propName,
          default: "__EMPTY__",
          inputRenderer: schema.get("inputRenderer"),
          required: schema.get("required"),
          enum: oneOfs.map(subSchema =>
            subSchema
              .get("properties")
              .get("value")
              .get("default")
          ),
          enum_titles: oneOfs.map(subSchema =>
            subSchema
              .get("properties")
              .get("value")
              .get("title")
          ),
          onChange: newValue => {
            // console.log('onChange', newValue);
            const state = {};
            // state[id + 'selected'] = newValue;
            if (!newValue.target) {
              state[`${id}selected`] = newValue;
            } else {
              state[`${id}selected`] = newValue.target.value;
            }
            me.setState(state);
            me._test = state;

            me.changeField(me.getNameFromPath(realPath.concat(["value"])), newValue);
          }
        }),
        data
      )
    );

    // render each enum as block
    container.children = container.children.concat(
      schema.get("oneOf").map(subSchema => {
        const value = subSchema
          .get("properties")
          .get("value")
          .get("default");

        if (
          (me.getState() && me.getState()[`${id}selected`] === value) ||
          (!me.getState() && schema.get("default") === value)
        ) {
          subSchema = subSchema.set(
            "properties",
            subSchema.get("properties").filter(item => item.get("title") !== "value")
          );
          return me.renderChunk(realPath.concat([]), subSchema /* .delete('title') */, data);
        }
        return null;
      })
    );

    return createElement("div", container);
  }

  /**
   *
   * @param path
   *
   * @returns {string}
   */
  getNameFromPath = path => `root.${path.join(".")}`;
  // return 'root' + (path.length ? path.map((nibble) => {
  //   return '[' + nibble + ']';
  // }).join('') : '');

  /**
   *
   * @param name
   *
   * @returns {string[]}
   */
  getPathFromName = name => name.replace(/^root\./, "").split(".");

  /**
   *
   * @param path
   *
   * @returns {string}
   */
  getIdFromPath = path => `root-${path.join("-")}`;

  /**
   * @param {Array} path
   * @param {Object} schema
   * @param {*} value
   */
  renderChunk = (path, schema, value = undefined) => {
    const propName = path.pop();
    // let className = propName;
    // if (!isNaN(parseInt(propName, 10))) {
    //   // singular class name from assumed multiple
    //   className = path[path.length - 1].slice(0, -1);
    // }
    const hasLabel =
      (this.options.get("hasLabels") || this.options.get("hasLabels") === undefined) && !schema.get("renderer");

    const isBooleanCheckbox = this.isBooleanEnum(schema);

    const classNames = ["schema-property", `schema-property-${propName}`, `schema-datatype-${schema.get("type")}`];
    if (isBooleanCheckbox) {
      classNames.push("schema-inputtype-checkbox");
    }
    if (this.options.get("groupClass") && schema.get("type") !== "object" && schema.get("type") !== "array") {
      classNames.push(
        isBooleanCheckbox && hasLabel ? this.options.get("buttonWrapperClass") : this.options.get("groupClass")
      );
    }

    const subPath = path.slice(0);
    // console.log(subPath);
    if (propName) {
      subPath.push(propName);
    }
    const id = this.getIdFromPath(subPath);
    const name = this.getNameFromPath(subPath);

    if (value === undefined && schema.get("default") !== undefined) {
      value = schema.get("default");
    }

    if (schema.get("renderer") === "hidden") {
      return this.renderInput("hidden", schema, subPath, value, id, name);
    }

    if (schema.get("inputRenderer") === "hidden") {
      return this.renderInput("hidden", schema, subPath, value, id, name);
    }

    const container = { className: classNames.join(" "), children: [], key: id };

    switch (schema.get("type")) {
      case undefined: // complex type
      case "object":
        container.children.push(this.renderObject(schema, subPath, value));
        break;

      case "array":
        container.children.push(this.renderArray(schema, subPath, value));
        break;

      default:
        if (hasLabel && !isBooleanCheckbox) {
          container.children.push(this.renderLabel(schema, subPath, id));
        }

        container.children.push(this.renderType(schema, subPath, value, id, name));

        if (hasLabel && isBooleanCheckbox) {
          container.children.push(this.renderLabel(schema, subPath, id));
        }
        break;
    }

    return createElement("div", container);
  };

  renderArray = (schema, path, value) => {
    // multiple select
    if (schema.get("items").get("enum")) {
      return this.renderChunk(
        path,
        schema
          .get("items")
          .set("title", schema.get("title"))
          .set("multiple", true),
        value
      );
    }

    // custom renderer
    if (schema && schema.get("renderer") && this.options.get("renderers")) {
      // override renderer
      if (this.options.get("renderers").get(schema.get("renderer"))) {
        return this.options.get("renderers").get(schema.get("renderer"))(
          {
            schema,
            path,
            id: this.getIdFromPath(path),
            name: this.getNameFromPath(path),
            value
          },
          this
        );
      }
    }

    return createElement(FieldArray, {
      key: this.getIdFromPath(path),
      name: this.getNameFromPath(path),
      schema: schema,
      component: this.renderArrayItems
    });
  };

  // eslint-disable-next-line react/prop-types
  renderArrayItems = ({ fields, /*meta,*/ schema }) => {
    const path = this.getPathFromName(fields.name);
    // console.info('schema', schema.toJS());
    // console.info('path', path);

    const title = schema.get("title");

    const id = this.getIdFromPath(path);
    return createElement("div", {
      key: id,
      className: "schema-property schema-datatype-array",
      children: [
        fields.map((field, idx) => {
          const itemItem = createElement("div", {
            key: `${id}-${field}`,
            children: [
              `${schema.get("title")} #${idx + 1}`,
              createElement("button", {
                key: `${id}-${field}-button-delete`,
                type: "button",
                onClick: () => fields.remove(idx),
                className: "btn btn-default",
                children: this.getString("delete")
              })
            ]
          });
          return this.renderObject(schema.get("items").set("title", itemItem), this.getPathFromName(field));
        }),
        createElement("div", {
          key: `${id}-buttons`,
          className: `${this.options.get("groupClass", "")} form-group-buttons`,
          children: createElement("div", {
            className: this.options.get("buttonWrapperClass", ""),
            children: createElement("button", {
              type: "button",
              onClick: () => fields.push(),
              className: "btn btn-default",
              children: [this.getString("addNew").replace("%s", title)]
            })
          })
        })
      ]
    });
  };

  isBooleanEnum = schema => {
    const enumVal = schema.get("enum");
    return schema.get("type") === "boolean" && enumVal && enumVal.size === 1;
  };

  renderLabel = (schema, path, id) => {
    const isBooleanCheckbox = this.isBooleanEnum(schema);
    const labelText =
      (schema.get("title") ? schema.get("title") : schema.get("description")) +
      (this.options.get("showRequired")
        ? schema.get("required") && schema.get("inputRenderer") !== "display"
          ? " *"
          : ""
        : "");
    const cfg = {
      className: isBooleanCheckbox ? "" : this.options.get("labelClass"),
      htmlFor: id,
      key: `${id}-label`,
      children: labelText
    };
    if (schema.get("labelAsHtml")) {
      cfg.dangerouslySetInnerHTML = { __html: labelText };
      cfg.children = null;
    }
    return createElement("label", cfg);
  };

  renderType = (schema, subPath, value, id, name) => {
    const isBooleanCheckbox = this.isBooleanEnum(schema);
    if (schema.get("enum") && schema.get("inputRenderer") !== "display" && !isBooleanCheckbox) {
      return this.renderEnum(schema, subPath, value, id, name);
    }

    let type = "text";

    // could not be a string (array of types is allowed). .in this case wew render a "string" input
    if (typeof schema.get("type") !== "string") {
      schema = schema.set("type", "string");
    }

    switch (schema.get("type")) {
      case "string":
        if (schema.get("format") === "date") {
          type = "date";
        }
        if (schema.get("format") === "datetime") {
          type = "datetime-local";
        }
        if (schema.get("format") === "email") {
          type = "email";
        }
        if (
          schema.get("inputRenderer") === "textarea" ||
          (schema.get("options") && schema.get("options").get("renderHint") === "textarea")
        ) {
          type = "textarea";
        }
        if (schema.get("inputRenderer") === "password") {
          type = "password";
        }
        break;
      case "integer":
      case "number":
        type = "number";
        break;
      case "boolean":
        type = "checkbox";
        break;
      default:
        throw new Error(`Schema item "${subPath.join(".")}" is not valid`);
    }
    if (schema.get("inputRenderer") === "display") {
      type = "display";
    }
    return this.renderInput(type, schema, subPath, value, id, name);
  };

  renderInput = (type, schema, path, value, id, name) => {
    let component = this.renderInputComponent;
    if (type === "textarea") {
      component = this.renderTextareaComponent;
    }
    if (type === "hidden") {
      component = "input";
    }
    if (type === "display") {
      component = this.renderDisplayComponent;
    }
    if (schema && schema.get("renderer") && this.options.get("renderers")) {
      // override renderer
      if (this.options.get("renderers").get(schema.get("renderer"))) {
        // TODO (breaking change) component = this.options.get('renderers').get(schema.get('renderer'));
        return this.options.get("renderers").get(schema.get("renderer"))({ schema, path, id, name, value, type }, this);
      }
    }

    const cfg = {
      key: `${id}-input`,
      component: component,
      id: id,
      type: type,
      name: name,
      required: schema.get("required") ? "required" : "",
      minLength: schema.get("minLength"),
      maxLength: schema.get("maxLength"),
      min: schema.get("min"),
      max: schema.get("max"),
      pattern: schema.get("pattern"),
      // defaultValue: schema.get('default'),
      placeholder:
        (schema.get("description") || schema.get("title")) +
        (this.options.get("showRequiredInPlaceholder") && schema.get("required") ? " *" : ""),
      autoComplete: schema.get("autocomplete")
    };
    if (type !== "hidden") {
      cfg.schema = schema;
    }

    /*
     Since iOS 5, type="email" has auto-capitalization disabled automatically, so you simply need:

     <input type="email">
     For other input types, there are attributes available that do what they say:

     <input type="text" autocorrect="off" autocapitalize="none">
     If for some reason you want to support iOS prior to version 5, use this for type="email":

     <input type="email" autocorrect="off" autocapitalize="none">

     */
    if (type === "email") {
      cfg.autoCapitalize = "none";
      cfg.autoCorrect = "off";
    }

    return this.createField(cfg);
  };

  renderEnum = (schema, path, value, id, name) => {
    if (schema.get("inputRenderer") === "radiogroup") {
      return this.renderBooleanEnum(schema, path, value, id, name);
    }

    if (schema.get("renderer") && this.options.get("renderers")) {
      // override renderer
      if (this.options.get("renderers").get(schema.get("renderer"))) {
        return this.options.get("renderers").get(schema.get("renderer"))({ schema, path, id, name, value }, this);
      }
    }

    const enumTitles =
      schema.get("enum_titles") || (schema.get("options") ? schema.get("options").get("enum_titles") : null);

    const options = schema.get("enum").map((value, idx) =>
      createElement("option", {
        key: value,
        value: value,
        children: enumTitles && enumTitles.get(idx) ? enumTitles.get(idx) : value
      })
    );

    const cfg = {
      component: this.renderSelectComponent,
      key: `${id}-input`,
      name: name,
      id: id,
      schema: schema,
      required: schema.get("required") ? "required" : "",
      multiple: schema.get("multiple") ? "multiple" : "",
      // multi: !!schema.get('multiple'),
      pattern: schema.get("pattern"),
      placeholder:
        schema.get("description") +
        (this.options.get("showRequiredInPlaceholder") && schema.get("required") ? " *" : ""),
      autoComplete: schema.get("autocomplete"),
      onChange: schema.get("onChange"),
      type: "select",
      children: options
    };
    return this.createField(cfg);
  };

  createField = cfg =>
    // cfg.withRef = cfg.name;
    createElement(Field, cfg);

  renderBooleanEnum = (schema, path, value, id, name) => {
    const enumTitles =
      schema.get("enum_titles") || (schema.get("options") ? schema.get("options").get("enum_titles") : null);

    return createElement("div", {
      className: `form-check radiogroup ${this.options.get("inputWrapperClass")}`,
      children: schema.get("enum").map((itemValue, idx) =>
        createElement("label", {
          key: `${id}-${itemValue}-label`,
          className: "form-check-label",
          children: [
            this.createField({
              key: `${id}-${itemValue}-input`,
              onChange: schema.get("onChange"),
              className: "form-check-input",
              component: this.renderInputComponent,
              id: `${id}-${idx}`,
              type: "radio",
              name: name,
              required: schema.get("required") ? "required" : "",
              disabled: schema.get("disabled", ImmutableList()).includes(itemValue),
              value: itemValue
            }),
            createElement("span", {
              children: enumTitles && enumTitles.get(idx) ? enumTitles.get(idx) : itemValue
            })
          ]
        })
      )
    });
  };

  renderDisplayComponent = field => this.renderFieldComponent("div", field);

  renderSelectComponent = field => this.renderFieldComponent("select", field);

  renderTextareaComponent = field => this.renderFieldComponent("textarea", field);

  renderInputComponent = field => this.renderFieldComponent("input", field);

  renderFieldError = field =>
    (field.meta.touched || field.meta.dirty) && field.meta.error
      ? createElement("div", {
          key: `${field.id}-error-feedback`,
          className: "form-control-feedback",
          children: this.t(field.meta.error)
        })
      : null;

  renderFieldComponent = (type, field) => {
    // add a error ref to the field ( this is for allowing scroll to error stuff )
    // if (field.meta.touched && field.meta.error) {
    //   console.log(field);
    //   field = React.cloneElement(field, { ref: 'error' });
    //   console.log(field);
    // }
    if (field.type === "radio") {
      return this.renderFieldInputComponent(type, field);
    }

    const isBooleanCheckbox = this.isBooleanEnum(field.schema);

    const children = [
      this.renderFieldInputComponent(type, field),
      this.renderFieldError(field),
      this.renderNote(field)
    ];

    const cfg = {
      key: `${field.id}-wrapper`,
      className: isBooleanCheckbox ? "" : this.options.get("inputWrapperClass"),
      children:
        field.type === "checkbox"
          ? createElement("div", {
              className: "checkbox",
              children: children
            })
          : children
    };

    if (field.meta.touched || field.meta.dirty) {
      cfg.className += ` ${this.options.get(field.meta.invalid ? "groupErrorClass" : "groupSuccessClass")}`;
    }

    return createElement("div", cfg);
  };

  renderNote = field => {
    if (!field.schema.get("note")) {
      return null;
    }
    return createElement("div", {
      children: createElement("small", {
        className: "form-text text-muted",
        children: field.schema.get("note")
      })
    });
  };

  renderFieldInputComponent(type, field) {
    if (type === "div") {
      return createElement(type, {
        className: this.options.get("inputStaticClass"),
        children: typeof field.input.value === "boolean" ? this.t(field.input.value) : field.input.value
      });
    }

    const className =
      (["checkbox", "radio"].indexOf(field.type) !== -1 ? "" : this.options.get("inputClass")) +
      (field.meta.touched ? ` ${this.options.get(field.meta.error ? "inputErrorClass" : "inputSuccessClass")}` : "");

    const { meta, schema, input, ...rest } = field; // eslint-disable-line no-unused-vars
    const props = {
      key: `${field.id}-FieldInputComponent`,
      ...rest,
      ...input,
      className
    };

    if (rest.onChange) {
      props.onChange = e => {
        rest.onChange(e.target.value);
        input.onChange(e.target.value);
      };
    }

    if (this.options.get("inputRenderers")) {
      // override inputRenderer by type
      if (field.type && this.options.get("inputRenderers").get(field.type)) {
        return this.options.get("inputRenderers").get(field.type)(field, this.options);
      }

      // custom inputRenderer
      if (
        schema &&
        schema.get("inputRenderer") &&
        this.options.get("inputRenderers").get(schema.get("inputRenderer"))
      ) {
        return this.options.get("inputRenderers").get(schema.get("inputRenderer"))(field, this.options);
      }
    }

    return createElement(type, props);
  }
}
