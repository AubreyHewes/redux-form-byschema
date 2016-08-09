import React, { createElement } from 'react';
import { Field } from 'redux-form';

/**
 * Renderer for a react-redux (v6) form via a JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default class Renderer {

  constructor (options) {
    this.options = options || {
      path: []
    };
  }

  renderObject = (schema, path, data) => {
    var chunkPromises = [];
    data = data || {};

    if (!schema.properties) {
      if (schema.allOf || schema.extends) {
        return <fieldset />;
      }
      if (schema.oneOf) {
        return <fieldset />;
      }
      if (schema.$ref) {
        return this.getRef(schema.$ref).then((subSchema) => {
          if (subSchema.get('properties')) {
            return this.renderObject(subSchema, path, data);
          } else {
            return this.renderChunk(path, subSchema, data);
          }
        });
      }

      if (schema.type && schema.type === 'array' && schema.items) {
        chunkPromises.push(this.renderChunk(path, schema, data));
      }
    }

    let container = {
      disabled: schema.disabled,
      children: []
    };

    if (schema.title) {
      container.children.push(createElement('legend', {
        className: 'legend', key: path, children: [schema.title]
      }));
    }

    if (schema.description) {
      container.children.push(createElement('p', {
        key: path, children: [schema.description]
      }));
    }

    schema.properties.map((propSchema, propName) => {
      if (schema.required && schema.required.indexOf(propName) !== -1) {
        propSchema = propSchema.set('required', true);
      }

      path.slice(0);
      path.push(propName);
      container.children.push(this.renderChunk(path, propSchema/*, data.get(propName)*/));
    });

    return createElement('fieldset', container);
  };

  /**
   *
   * @param {Array} path
   * @param {Object} schema
   * @param {*} value
   */
  renderChunk = (path, schema, value) => {
    let propName = path.pop();
    let className = propName;
    if (!isNaN(parseInt(propName, 10))) {
      // singular class name from assumed multiple
      className = path[path.length - 1].slice(0, -1);
    }
    let id = 'root-' + (path.length ? path.join('-') + '-' : '') + propName;

    let classNames = ['schema-property', 'schema-property-' + className, 'schema-datatype-' + schema.type];
    if (this.options.groupClass && schema.type !== 'object') {
      classNames.push(this.options.groupClass);
    }

    let subPath = path.slice(0);
    let name = 'root' + (path.length ? '[' + path.join('][') + ']' : '') + '[' + propName + ']';
    subPath.push(propName);

    if ((value === undefined) && (schema['default'] !== undefined)) {
      value = schema['default'];
    }

    if (schema.renderer === 'hidden') {
      return this.renderInput('hidden', schema, subPath, value, id, name);
    }

    let container = {className: classNames.join(' '), children: [], key: id};

    switch (schema.type) {
      case undefined: // complex type
      case 'object':
        container.children.push(this.renderObject(schema, subPath, value));
        break;
      default:

        if (this.options.hasLabels || this.options.hasLabels === undefined) {
          container.children.push(createElement('label', {
            className: this.options.labelClass,
            htmlFor: id, key: subPath.concat('label'),
            children: [schema.title ? schema.title : schema.description]
          }));
        }

        container.children.push(this.renderType(schema, subPath, value, id, name));
        break;
    }

    return createElement('div', container);
  };

  renderType = (schema, subPath, value, id, name) => {
    if (schema.enum) {
      return this.renderEnum(schema, subPath, value, id, name);
    }

    let type = 'text';
    switch (schema.type) {
      case 'string':
        if (schema.format === 'date') {
          type = 'date';
        }
        if (schema.format === 'datetime') {
          type = 'datetime-local';
        }
        if (schema.format === 'email') {
          type = 'email';
        }
        if (schema.renderer === 'textarea') {
          type = 'textarea';
        }
        if (schema.renderer === 'password') {
          type = 'password';
        }
        break;
      case 'integer':
      case 'number':
        type = 'number';
        break;
      case 'boolean':
        type = 'checkbox';
        break;
      default:
        throw new Error('Schema item "' + subPath.join('.') + '" is not valid');
    }
    return this.renderInput(type, schema, subPath, value, id, name);
  };

  renderInput = (type, schema, path, value, id, name) => {
    let component = this.renderInputComponent;

    if (type === 'textarea') {
      component = this.renderTextareaComponent;
    }
    if (type === 'hidden') {
      component = 'input';
    }
    if (type === 'display') {
      component = this.renderDisplayComponent;
    }

    return createElement(Field, {
      key: path,
      id: id,
      component: component,
      type: type,
      name: name,
      required: schema.required ? 'required' : '',
      minlength: schema.minLength,
      maxlength: schema.maxLength,
      min: schema.min,
      max: schema.max,
      pattern: schema.pattern,
      placeholder: schema.description,
      autoComplete: schema.autocomplete
    });
  };

  renderEnum = (schema, path, value, id, name) => {
    if (schema.renderer === 'radiogroup') {
      return this.renderBooleanEnum(schema, path, value, id, name);
    }

    return createElement(Field, {
      component: this.renderSelectComponent,
      key: path,
      id: id,
      name: name,
      required: schema.required ? 'required' : '',
      multi: schema.multi,
      pattern: schema.pattern,
      placeholder: schema.description,
      autoComplete: schema.autocomplete,
      children: schema.enum.map((value, idx) => {
        return createElement('option', {
          value: value,
          children: [
            schema.enum_titles &&
            schema.enum_titles.get(idx) ? schema.enum_titles.get(idx) : value
          ]
        });
      })
    });
  };

  renderBooleanEnum = (schema, path, value, id, name) => {
    return createElement('div', {
      className: 'radiogroup ' + this.options.inputWrapperClass,
      children: schema.enum.map((itemValue, idx) => {
        return createElement('label', {className: this.options.radioGroupInlineClass, children: [
          createElement(Field, {
            key: name + itemValue,
            component: this.renderInputComponent,
            autoComplete: schema.autocomplete,
            id: id + '-' + idx,
            type: 'radio',
            name: name,
            required: schema.required ? 'required' : '',
            value: itemValue
          }),
          schema.enum_titles &&
          schema.enum_titles.get(idx) ? schema.enum_titles.get(idx) : itemValue
        ]});
      })
    });
  };

  renderDisplayComponent = (field) => {
    return this.renderFieldComponent('div', field);
  };

  renderSelectComponent = (field) => {
    return this.renderFieldComponent('select', field);
  };

  renderTextareaComponent = (field) => {
    return this.renderFieldComponent('textarea', field);
  };

  renderInputComponent = (field) => {
    return this.renderFieldComponent('input', field);
  };

  renderFieldComponent = (type, field) => {
    if (field.type === 'radio') {
      return this.renderFieldInputComponent(type, field);
    }

    let children = [
      this.renderFieldInputComponent(type, field),
      field.touched && field.error ? createElement('span', {children: [field.error]}) : null
    ];

    return createElement('div', {
      className: this.options.inputWrapperClass,
      key: field.id,
      children: field.type === 'checkbox' ? createElement('div', {
        className: 'checkbox',
        children: children
      }) : children
    });
  };

  renderFieldInputComponent (type, field) {
    if (type === 'div') {
      return createElement(type, {
        className: this.options.inputClass + ' form-control-display',
        children: [field.input.value]
      });
    }
    return createElement(type, {
      className: ['checkbox', 'radio'].indexOf(field.type) !== -1 ? '' : this.options.inputClass,
      ... field
    });
  }

}
