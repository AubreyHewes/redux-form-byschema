import Immutable from 'immutable';
import React, { createElement } from 'react';
import { Field } from 'redux-form';
import Locale from '../i18n/en';

/**
 * Renderer for a react-redux (v6) form via an Immutable JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default class Renderer {

  constructor (options) {
    if (typeof options !== Immutable.Map) {
      options = new Immutable.Map(options);
    }
    this.options = new Immutable.Map({
      path: [],
      locale: new Locale()
    }).mergeDeep(options);
  }

  renderObject = (schema, path, data) => {
    let chunkPromises = [];
    data = data || {};

    if (!schema.get('properties')) {
      if (schema.get('allOf') || schema.get('extends')) {
        return <fieldset key={path} />;
      }
      if (schema.get('oneOf')) {
        return this.renderOneOf(schema, path, data);
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
   * @TODO klevera
   *
   * @param {Object} schema
   * @param {Array} path
   * @param {Object} data
   *
   * @returns {*}
   */
  renderOneOf (schema, path, data) {
    const propName = path.pop();
    // const name = 'root' + (path.length ? '[' + path.join('][') + ']' : '') + '[' + propName + ']';
    const id = (path.length ? path.join('-') + '-' : '') + propName;

    path.push(propName);

    let classNames = ['schema-property', 'schema-property-oneOf'];
    if (this.options.get('groupClass') && schema.get('type') !== 'object') {
      classNames.push(this.options.get('groupClass'));
    }

    let container = {
      className: classNames.join(' '),
      children: []
    };

    const me = this;
    let realPath = path.concat([]);

    container.children.push(this.renderChunk(path, new Immutable.Map({
      'type': 'string',
      'title': schema.get('title'),
      'name': propName,
      'enum': schema.get('oneOf').map((subSchema) => {
        return subSchema.get('title');
      }),
      'onChange': (event) => {
        let state = {};
        state[id + 'selected'] = event.target.value;
        me.setState(state);
      }
    }), data));

    // render each enum as block
    container.children = container.children.concat(schema.get('oneOf').map(function (subSchema, idx) {
      if (me.getState() && me.getState()[id + 'selected'] === subSchema.get('title')) {
        return me.renderChunk(realPath.concat(), subSchema.delete('title'), data);
      }
      // subSchema = subSchema.delete('title').set('disabled', false);
      // if (subSchema.get('disabled')) {
      //   return null;
      // }
      return null;
    }));

    return createElement('div', container);
  }

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

    if ((value === undefined) && (schema.get('default') !== undefined)) {
      value = schema.get('default');
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
          container.children.push(this.renderLabel(schema, subPath, id));
        }

        container.children.push(this.renderType(schema, subPath, value, id, name));
        break;
    }

    return createElement('div', container);
  };

  renderLabel = (schema, path, id) => {
    return createElement('label', {
      className: this.options.get('labelClass'),
      htmlFor: id,
      key: id + '-label',
      children: [
        (schema.get('title') ? schema.get('title') : schema.get('description')) +
        (this.options.get('showRequired') ? (schema.get('required') ? ' *' : '') : '')]
    });
  };

  renderType = (schema, subPath, value, id, name) => {
    if (schema.get('enum')) {
      return this.renderEnum(schema, subPath, value, id, name);
    }

    let type = 'text';

    // could not be a string (array of types is allowed). .in this case wew render a "string" input
    if (typeof schema.get('type') !== 'string') {
      schema = schema.set('type', 'string');
    }

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

    let cfg = {
      key: id + '-input',
      component: component,
      id: id,
      type: type,
      name: name,
      required: schema.get('required') ? 'required' : '',
      minLength: schema.get('minLength'),
      maxLength: schema.get('maxLength'),
      min: schema.get('min'),
      max: schema.get('max'),
      pattern: schema.get('pattern'),
      placeholder: schema.get('description') || schema.get('title'),
      autoComplete: schema.get('autocomplete')
    };

    /*
     Since iOS 5, type="email" has auto-capitalization disabled automatically, so you simply need:

     <input type="email">
     For other input types, there are attributes available that do what they say:

     <input type="text" autocorrect="off" autocapitalize="none">
     If for some reason you want to support iOS prior to version 5, use this for type="email":

     <input type="email" autocorrect="off" autocapitalize="none">

     */
    if (type === 'email') {
      cfg.autoCapitalize = 'none';
      cfg.autoCorrect = 'off';
    }

    return createElement(Field, cfg);
  };

  renderEnum = (schema, path, value, id, name) => {
    if (schema.get('renderer') === 'radiogroup') {
      return this.renderBooleanEnum(schema, path, value, id, name);
    }

    let cfg = {
      component: this.renderSelectComponent,
      key: id + '-input',
      name: name,
      id: id,
      required: schema.get('required') ? 'required' : '',
      multiple: schema.get('multiple'),
      pattern: schema.get('pattern'),
      placeholder: schema.get('description'),
      autoComplete: schema.get('autocomplete'),
      onChange: schema.get('onChange'),
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
    };

    if (schema.get('default')) {
      cfg.defaultValue = schema.get('default');
    }
    return createElement(Field, cfg);
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
      // <small class="form-text text-muted">Example help text that remains unchanged.</small>
      field.meta.touched && field.meta.error ? createElement('div', {
        className: 'form-control-feedback', children: [
          this.options.get('locale') ? this.options.get('locale').getString(field.meta.error) : field.meta.error
        ]
      }) : null
    ];

    let cfg = {
      className: this.options.get('inputWrapperClass'),
      key: field.id + '-wrapper',
      children: field.type === 'checkbox' ? createElement('div', {
        className: 'checkbox',
        children: children
      }) : children
    };

    if (field.meta.touched) {
      cfg.className += ' ' + this.options.get(field.meta.error ? 'groupErrorClass' : 'groupSuccessClass');
    }

    return createElement('div', cfg);
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
      (field.meta.touched ? ' ' + this.options.get(field.meta.error ? 'inputErrorClass' : 'inputSuccessClass') : ''),
      ... field,
      ... field.input
    });
  }

}
