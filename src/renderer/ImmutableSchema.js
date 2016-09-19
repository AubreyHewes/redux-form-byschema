import Immutable from 'immutable';
import React, { createElement } from 'react';
import { Field, FieldArray } from 'redux-form';
import Locale from '../i18n/en';

// const Select = 'select';
import Select from 'react-virtualized-select';

/**
 * Renderer for a react-redux (v6) form via an Immutable JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default class Renderer {

  constructor (options) {
    if (!Immutable.Map.isMap(options)) {
      throw new Error('Options should be an immutable map!');
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

    if (schema.get('properties')) {
      schema.get('properties').map((propSchema, propName) => {
        if (schema.get('required') && schema.get('required').findEntry && schema.get('required').findEntry((prop) => {
          return prop === propName;
        })) {
          if (propSchema.get('type') !== 'object' || propSchema.get('oneOf')) {
            propSchema = propSchema.set('required', true);
          }
        }

        path.slice(0);
        path.push(propName);
        container.children.push(this.renderChunk(path, propSchema/*, data.get(propName)*/));
      });
    }

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
    const propName = 'renderOneOf';
    const id = (path.length ? path.join('-') + '-' : '') + propName;

    let classNames = ['schema-property', 'schema-property-oneOf'];
    if (this.options.get('groupClass') && schema.get('type') !== 'object') {
      classNames.push(this.options.get('groupClass'));
    }

    let container = {
      className: classNames.join(' '),
      children: []
    };

    const me = this;
    const realPath = path;

    // console.log(schema.toJS());
    container.children.push(this.renderChunk(realPath.concat([propName]), new Immutable.Map({
      'type': 'string',
      'title': schema.get('title'),
      'name': propName,
      'required': schema.get('required'),
      'enum': schema.get('oneOf').map((subSchema) => {
        return subSchema.get('title');
      }),
      'onChange': (newValue) => {
        let state = {};
        state[id + 'selected'] = newValue ? newValue.value : null;
        me.setState(state);
        me.removeField(me.getNameFromPath(realPath));
        me.changeField(me.getNameFromPath(realPath.concat(['value'])), newValue ? newValue.value : null);
      }
    }), data));

    // render each enum as block
    container.children = container.children.concat(schema.get('oneOf').map(function (subSchema, idx) {
      if (me.getState() && me.getState()[id + 'selected'] === subSchema.get('title')) {
        return me.renderChunk(realPath.concat([]), subSchema/* .delete('title') */, data);
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
   *
   * @param path
   *
   * @returns {string}
   */
  getNameFromPath = (path) => {
    return 'root.' + path.join('.');
    // return 'root' + (path.length ? path.map((nibble) => {
    //   return '[' + nibble + ']';
    // }).join('') : '');
  };

  /**
   *
   * @param name
   *
   * @returns {string}
   */
  getPathFromName = (name) => {
    return name.replace(/^root\./, '').split('.');
  };

  /**
   *
   * @param path
   *
   * @returns {string}
   */
  getIdFromPath = (path) => {
    return 'root-' + path.join('-');
  };

  /**
   * @param {Array} path
   * @param {Object} schema
   * @param {*} value
   */
  renderChunk = (path, schema, value) => {
    let propName = path.pop();
    // let className = propName;
    // if (!isNaN(parseInt(propName, 10))) {
    //   // singular class name from assumed multiple
    //   className = path[path.length - 1].slice(0, -1);
    // }

    let classNames = ['schema-property', 'schema-property-' + propName, 'schema-datatype-' + schema.get('type')];
    if (this.options.get('groupClass') && schema.get('type') !== 'object' && schema.get('type') !== 'array') {
      classNames.push(this.options.get('groupClass'));
    }

    let subPath = path.slice(0);
    // console.log(subPath);
    if (propName) {
      subPath.push(propName);
    }
    let id = this.getIdFromPath(subPath);
    let name = this.getNameFromPath(subPath);

    if ((value === undefined) && (schema.get('default') !== undefined)) {
      value = schema.get('default');
    }

    if (schema.get('inputRenderer') === 'hidden') {
      return this.renderInput('hidden', schema, subPath, value, id, name);
    }

    let container = {className: classNames.join(' '), children: [], key: id};

    switch (schema.get('type')) {
      case undefined: // complex type
      case 'object':
        container.children.push(this.renderObject(schema, subPath, value));
        break;

      case 'array':
        container.children.push(this.renderArray(schema, subPath, value));
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

  renderArray = (schema, path, value) => {
    // multiple select
    if (schema.get('items').get('enum')) {
      return this.renderChunk(path, schema.get('items').set('title', schema.get('title')).set('multiple', true), value);
    }

    return createElement(FieldArray, {
      name: this.getNameFromPath(path),
      component: ({ fields, meta, name }) => {
        let path = this.getPathFromName(name);
        // console.log(fields);
        return createElement('div', {
          className: 'schema-property schema-datatype-array',
          children: fields.map((field, idx) => {
            let subPath = path;
            subPath.push(idx);
            return this.renderObject(schema.get('items').set('title', schema.get('title') + ' #' + (idx + 1)), subPath);
          })
        });
      }
    });
  };

  renderLabel = (schema, path, id) => {
    return createElement('label', {
      className: this.options.get('labelClass'),
      htmlFor: id,
      key: id + '-label',
      children: [
        (schema.get('title') ? schema.get('title') : schema.get('description')) +
        (this.options.get('showRequired')
          ? (schema.get('required') && schema.get('inputRenderer') !== 'display' ? ' *' : '') : '')]
    });
  };

  renderType = (schema, subPath, value, id, name) => {
    if (schema.get('enum') && schema.get('inputRenderer') !== 'display') {
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
        if (schema.get('inputRenderer') === 'textarea') {
          type = 'textarea';
        }
        if (schema.get('inputRenderer') === 'password') {
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
    if (schema.get('inputRenderer') === 'display') {
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
      // defaultValue: schema.get('default'),
      placeholder: schema.get('description') || schema.get('title'),
      autoComplete: schema.get('autocomplete')
    };
    if (type !== 'hidden') {
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
    if (type === 'email') {
      cfg.autoCapitalize = 'none';
      cfg.autoCorrect = 'off';
    }

    return createElement(Field, cfg);
  };

  renderEnum = (schema, path, value, id, name) => {
    if (schema.get('inputRenderer') === 'radiogroup') {
      return this.renderBooleanEnum(schema, path, value, id, name);
    }

    let enumTitles = schema.get('enum_titles') ||
      (schema.get('options') ? schema.get('options').get('enum_titles') : null);

    let options = schema.get('enum').map((value, idx) => {
      return {
        value: value,
        label: enumTitles && enumTitles.get(idx) ? enumTitles.get(idx) : value
      };
    }).toJS();

    let cfg = {
      component: this.renderSelectComponent,
      key: id + '-input',
      name: name,
      id: id,
      schema: schema,
      required: schema.get('required') ? 'required' : '',
      multiple: schema.get('multiple') ? 'multiple' : '',
      multi: !!schema.get('multiple'),
      pattern: schema.get('pattern'),
      placeholder: schema.get('description'),
      autoComplete: schema.get('autocomplete'),
      onChange: schema.get('onChange'),
      options: options
    };
    return createElement(Field, cfg);
  };

  renderBooleanEnum = (schema, path, value, id, name) => {
    let enumTitles = schema.get('enum_titles') ||
      (schema.get('options') ? schema.get('options').get('enum_titles') : null);

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
            enumTitles && enumTitles.get(idx) ? enumTitles.get(idx) : itemValue
          ]
        });
      })
    });
  };

  renderDisplayComponent = (field) => {
    return this.renderFieldComponent('div', field);
  };

  renderSelectComponent = (field) => {
    return this.renderFieldComponent(Select, field);
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
        className: this.options.get('inputStaticClass'),
        children: [field.input.value]
      });
    }

    let className = (['checkbox', 'radio'].indexOf(field.type) !== -1 ? '' : this.options.get('inputClass')) +
      (field.meta.touched ? ' ' + this.options.get(field.meta.error ? 'inputErrorClass' : 'inputSuccessClass') : '');

    const {meta, schema, input, ...rest} = field;
    let props = {
      ... rest,
      ... input,
      className
    };
    if (type === Select) {
      props.className = (meta.touched ? ' ' +
        this.options.get(meta.error ? 'inputErrorClass' : 'inputSuccessClass') : '');
      props.value = input.value || null;
      props.onBlur = () => input.onBlur(field.input.value);
      props.clearable = rest.required !== 'required';
      props.required = rest.required === 'required';
      if (rest.onChange) {
        props.onChange = (value) => {
          rest.onChange(value); // react-select
          input.onChange(value ? value.value : null); // redux-form Field
        };
      }
      if (this.options.get('locale').getString('select')) {
        props = {...props, ...this.options.get('locale').getString('select')};
      }
    }
    // trace(props);
    // trace(props);

    if (schema.get('inputRenderer') && this.options.get('inputRenderers') &&
        this.options.get('inputRenderers').get(schema.get('inputRenderer'))) {
      return this.options.get('inputRenderers').get(schema.get('inputRenderer'))(field);
    }

    return createElement(type, {
      ...props
    });
  }

}
