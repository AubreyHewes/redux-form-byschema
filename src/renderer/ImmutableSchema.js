import Immutable from 'immutable';
import React, { createElement } from 'react';
import { Field } from 'redux-form';

/**
 * Renderer for a react-redux (v6) form via an Immutable JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default class Renderer {

  constructor (options) {
    this.options = options || Immutable.Map({
      path: []
    });
  }

  renderObject = (schema, path, data) => {
    var chunkPromises = [];
    data = data || {};

    if (!schema.get('properties')) {
      if (schema.get('allOf') || schema.get('extends')) {
        return <fieldset key={path} />;
      }
      if (schema.get('oneOf')) {
        return <fieldset key={path} />;
      }
      if (schema.get('$ref')) {
        return this.getRef(schema.get('$ref')).then((subSchema) => {
          if (subSchema.get('properties')) {
            return this.renderObject(subSchema, path, data);
          } else {
            return this.renderChunk(path, subSchema, data);
          }
        });
      }

      if (schema.get('type') && schema.get('type') === 'array' && schema.get('items')) {
        chunkPromises.push(this.renderChunk(path, schema, data));
      }
    }

    let container = {
      key: path,
      disabled: schema.get('disabled'),
      children: []
    };

    if (schema.get('title')) {
      container.children.push(createElement('legend', {
        className: 'legend', children: [schema.get('title')]
      }));
    }

    if (schema.get('description')) {
      container.children.push(createElement('p', {
        children: [schema.get('description')]
      }));
    }

    schema.get('properties').map((propSchema, propName) => {
      if (schema.get('required') && schema.get('required').findEntry && schema.get('required').findEntry((prop) => {
        return prop === propName;
      })) {
        if (propSchema.get('type') !== 'object') {
          propSchema = propSchema.set('required', true);
        }
      }

      path.slice(0);
      path.push(propName);
      container.children.push(this.renderChunk(path, propSchema/*, data.get(propName)*/));
    });

    return createElement('fieldset', container);
  };

  /**
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

    let classNames = ['schema-property', 'schema-property-' + className, 'schema-datatype-' + schema.get('type')];
    if (this.options.get('groupClass') && schema.get('type') !== 'object') {
      classNames.push(this.options.get('groupClass'));
    }

    let subPath = path.slice(0);
    let name = 'root' + (path.length ? '[' + path.join('][') + ']' : '') + '[' + propName + ']';
    subPath.push(propName);

    if ((value === undefined) && (schema['default'] !== undefined)) {
      value = schema['default'];
    }

    if (schema.get('renderer') === 'hidden') {
      return this.renderInput('hidden', schema, subPath, value, id, name);
    }

    let container = {className: classNames.join(' '), children: [], key: id};

    switch (schema.get('type')) {
      case undefined: // complex type
      case 'object':
        container.children.push(this.renderObject(schema, subPath, value));
        break;
      default:

        if (this.options.get('hasLabels') || this.options.get('hasLabels') === undefined) {
          container.children.push(createElement('label', {
            className: this.options.get('labelClass'),
            htmlFor: id, key: subPath.concat('label'),
            children: [schema.get('title') ? schema.get('title') : schema.get('description')]
          }));
        }

        container.children.push(this.renderType(schema, subPath, value, id, name));
        break;
    }

    return createElement('div', container);
  };

  renderType = (schema, subPath, value, id, name) => {
    if (schema.get('enum')) {
      return this.renderEnum(schema, subPath, value, id, name);
    }

    let type = 'text';
    switch (schema.get('type')) {
      case 'string':
        if (schema.get('format') === 'date') {
          type = 'date';
        }
        if (schema.get('format') === 'datetime') {
          type = 'datetime-local';
        }
        if (schema.get('format') === 'email') {
          type = 'email';
        }
        if (schema.get('renderer') === 'textarea') {
          type = 'textarea';
        }
        if (schema.get('renderer') === 'password') {
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
    if (schema.get('renderer') === 'display') {
      type = 'display';
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
      required: schema.get('required') ? 'required' : '',
      minLength: schema.get('minLength'),
      maxLength: schema.get('maxLength'),
      min: schema.get('min'),
      max: schema.get('max'),
      pattern: schema.get('pattern'),
      placeholder: schema.get('description'),
      autoComplete: schema.get('autocomplete')
    });
  };

  renderEnum = (schema, path, value, id, name) => {
    if (schema.get('renderer') === 'radiogroup') {
      return this.renderBooleanEnum(schema, path, value, id, name);
    }

    return createElement(Field, {
      component: this.renderSelectComponent,
      key: path,
      id: id,
      name: name,
      required: schema.get('required') ? 'required' : '',
      multiple: schema.get('multiple'),
      pattern: schema.get('pattern'),
      placeholder: schema.get('description'),
      autoComplete: schema.get('autocomplete'),
      children: schema.get('enum').map((value, idx) => {
        return createElement('option', {
          key: value + idx,
          value: value,
          children: [
            schema.get('enum_titles') &&
            schema.get('enum_titles').get(idx) ? schema.get('enum_titles').get(idx) : value
          ]
        });
      })
    });
  };

  renderBooleanEnum = (schema, path, value, id, name) => {
    return createElement('div', {
      className: 'radiogroup ' + this.options.get('inputWrapperClass'),
      children: schema.get('enum').map((itemValue, idx) => {
        return createElement('label', {
          key: idx + itemValue,
          className: this.options.get('radioGroupInlineClass'),
          children: [
            createElement(Field, {
              key: name + itemValue,
              component: this.renderInputComponent,
              id: id + '-' + idx,
              type: 'radio',
              name: name,
              required: schema.get('required') ? 'required' : '',
              autoComplete: schema.get('autocomplete'),
              value: itemValue
            }),
            schema.get('enum_titles') &&
            schema.get('enum_titles').get(idx) ? schema.get('enum_titles').get(idx) : itemValue
          ]
        });
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
      field.touched && field.error ? createElement('span', {className: 'error', children: [field.error]}) : null
    ];

    return createElement('div', {
      className: this.options.get('inputWrapperClass'),
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
        className: this.options.get('inputClass') + ' form-control-display',
        children: [field.input.value]
      });
    }
    return createElement(type, {
      className: (['checkbox', 'radio'].indexOf(field.type) !== -1 ? '' : this.options.get('inputClass')) +
        (field.error ? 'user-error' : ''),
      ... field.input
    });
  }

}
