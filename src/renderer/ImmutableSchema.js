import Immutable from 'immutable';
import React, { createElement } from 'react';
import { Field, FieldArray } from 'redux-form';
import Locale from '../i18n/en';

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

    if (schema && schema.get('renderer') && this.options.get('renderers')) {
      // override renderer
      if (this.options.get('renderers').get(schema.get('renderer'))) {
        return this.options.get('renderers').get(schema.get('renderer'))({ schema, path, data }, this);
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
    const propName = 'value';
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

    // const field = createElement(Field, {
    //   component: 'input',
    //   type: 'text',
    //   name: realPath.concat([propName]).join('.')
    // });
    // if (__DEBUG__) {
    //   console.log(field);
    // }
    const oneOfs = schema.get('oneOf').filter((subSchema) => {
      return subSchema.get('properties').get('value').get('default') !== null;
    });

    // console.log(schema.toJS());
    container.children.push(this.renderChunk(realPath.concat([propName]), new Immutable.Map({
      'type': 'string',
      'title': schema.get('title'),
      'name': propName,
      'default': '__EMPTY__',
      'inputRenderer': schema.get('inputRenderer'),
      'required': schema.get('required'),
      'enum': oneOfs.map((subSchema) => {
        return subSchema.get('properties').get('value').get('default');
      }),
      'enum_titles': oneOfs.map((subSchema) => {
        return subSchema.get('properties').get('value').get('title');
      }),
      'onChange': (newValue) => {
        // console.log('onChange', newValue);
        let state = {};
        state[id + 'selected'] = newValue;
        me.setState(state);

        me._test = state;
        // let subSchema = schema.get('oneOf').filter((subSchema) => {
        //   return state[id + 'selected'] === subSchema.get('title');
        // });
        // console.log(subSchema);
        //
        // if (subSchema.get('additionalProperties') === false) {
        //   subSchema.get('properties').map((subSchema) => {
        //     // me.removeField(me.getNameFromPath(realPath));
        //   });
        // }

        me.changeField(me.getNameFromPath(realPath.concat(['value'])), newValue);
      }
    }), data));

    // render each enum as block
    container.children = container.children.concat(schema.get('oneOf').map(function (subSchema, idx) {
      // if (me.getState()) {
      //   console.log(me.getState()[id + 'selected']);
      // }
      // console.log('state', me._test && me._test[id + 'selected'] ? me._test[id + 'selected'] : null);

      const value = subSchema.get('properties').get('value').get('default');

      if (me.getState() && me.getState()[id + 'selected'] === value ||
          !me.getState() && schema.get('default') === value) {
        subSchema = subSchema.set('properties', subSchema.get('properties').filter((item) => {
          return item.get('title') !== 'value';
        }));
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

    if (schema.get('renderer') === 'hidden') {
      return this.renderInput('hidden', schema, subPath, value, id, name);
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

        if ((this.options.get('hasLabels') || this.options.get('hasLabels') === undefined) &&
            !schema.get('renderer')) {
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

    // custom renderer
    if (schema && schema.get('renderer') && this.options.get('renderers')) {
      // override renderer
      if (this.options.get('renderers').get(schema.get('renderer'))) {
        return this.options.get('renderers').get(schema.get('renderer'))({
          schema, path, id: this.getIdFromPath(path), name: this.getNameFromPath(path), value
        }, this);
      }
    }

    return createElement(FieldArray, {
      name: this.getNameFromPath(path),
      schema: schema,
      component: this.renderArrayItems
    });
  };

  renderArrayItems = ({ fields, meta, schema }) => {
    // const addRow = () => fields.push({});
    return createElement('div', {
      className: 'schema-property schema-datatype-array',
      children: [
        fields.map((field, idx) => {
          return this.renderObject(schema.get('items').set('title', schema.get('title') + ' #' + (idx + 1)),
            this.getPathFromName(field));
        })/*,
        createElement('div', {
          children: [
            <button type="button" onClick={addRow}>Toevoegen</button>
          ]
        })*/
      ]
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
        if (schema.get('inputRenderer') === 'textarea' ||
            schema.get('options') && schema.get('options').get('renderHint') === 'textarea') {
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
    if (schema && schema.get('renderer') && this.options.get('renderers')) {
      // override renderer
      if (this.options.get('renderers').get(schema.get('renderer'))) {
        return this.options.get('renderers').get(schema.get('renderer'))({schema, path, id, name, value, type}, this);
      }
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

    return this.createField(cfg);
  };

  renderEnum = (schema, path, value, id, name) => {
    if (schema.get('inputRenderer') === 'radiogroup') {
      return this.renderBooleanEnum(schema, path, value, id, name);
    }

    if (schema.get('renderer') && this.options.get('renderers')) {
      // override renderer
      if (this.options.get('renderers').get(schema.get('renderer'))) {
        return this.options.get('renderers').get(schema.get('renderer'))({schema, path, id, name, value}, this);
      }
    }

    let enumTitles = schema.get('enum_titles') ||
      (schema.get('options') ? schema.get('options').get('enum_titles') : null);

    let options = schema.get('enum').map((value, idx) => {
      return createElement('option', {
        value: value,
        children: [
          enumTitles && enumTitles.get(idx) ? enumTitles.get(idx) : value
        ]
      });
    });

    let cfg = {
      component: this.renderSelectComponent,
      key: id + '-input',
      name: name,
      id: id,
      schema: schema,
      required: schema.get('required') ? 'required' : '',
      multiple: schema.get('multiple') ? 'multiple' : '',
      // multi: !!schema.get('multiple'),
      pattern: schema.get('pattern'),
      placeholder: schema.get('description'),
      autoComplete: schema.get('autocomplete'),
      onChange: schema.get('onChange'),
      type: 'select',
      children: options
    };
    return this.createField(cfg);
  };

  createField (cfg) {
    // cfg.withRef = cfg.name;
    return createElement(Field, cfg);
  };

  renderBooleanEnum = (schema, path, value, id, name) => {
    let enumTitles = schema.get('enum_titles') ||
      (schema.get('options') ? schema.get('options').get('enum_titles') : null);

    return createElement('div', {
      className: 'form-check radiogroup ' + this.options.get('inputWrapperClass'),
      children: schema.get('enum').map((itemValue, idx) => {
        return createElement('label', {
          key: idx + itemValue,
          className: 'form-check-label',
          children: [
            this.createField({
              onChange: schema.get('onChange'),
              className: 'form-check-input',
              key: name + itemValue,
              component: this.renderInputComponent,
              id: id + '-' + idx,
              type: 'radio',
              name: name,
              required: schema.get('required') ? 'required' : '',
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
    return this.renderFieldComponent('select', field);
  };

  renderTextareaComponent = (field) => {
    return this.renderFieldComponent('textarea', field);
  };

  renderInputComponent = (field) => {
    return this.renderFieldComponent('input', field);
  };

  renderFieldComponent = (type, field) => {
    //
    // add a error ref to the field ( this is for allowing scroll to error stuff )
    // if (field.meta.touched && field.meta.error) {
    //   console.log(field);
    //   field = React.cloneElement(field, { ref: 'error' });
    //   console.log(field);
    // }

    // console.log(field);

    if (field.type === 'radio') {
      return this.renderFieldInputComponent(type, field);
    }

    let children = [
      this.renderFieldInputComponent(type, field),
      // <small class="form-text text-muted">Example help text that remains unchanged.</small>
      (field.meta.touched || field.meta.dirty) && field.meta.error ? createElement('div', {
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

    if (field.meta.touched || field.meta.dirty) {
      cfg.className += ' ' + this.options.get(field.meta.invalid ? 'groupErrorClass' : 'groupSuccessClass');
    }

    return createElement('div', cfg);
  };

  renderFieldInputComponent (type, field) {
    if (type === 'div') {
      return createElement(type, {
        className: this.options.get('inputStaticClass'),
        children: [typeof field.input.value === 'boolean'
          ? this.options.get('locale').getString(field.input.value) : field.input.value]
      });
    }

    let className = (['checkbox', 'radio'].indexOf(field.type) !== -1 ? '' : this.options.get('inputClass')) +
      (field.meta.touched ? ' ' + this.options.get(field.meta.error ? 'inputErrorClass' : 'inputSuccessClass') : '');

    const { meta, schema, input, ...rest } = field; // eslint-disable-line no-unused-vars
    let props = {
      ... rest,
      ... input,
      className
    };

    if (rest.onChange) {
      props.onChange = (e) => {
        rest.onChange(e.target.value);
        input.onChange(e.target.value);
      };
    }

    // console.log(schema.toJS());

    if (this.options.get('inputRenderers')) {
      // override inputRenderer by type
      if (field.type && this.options.get('inputRenderers').get(field.type)) {
        return this.options.get('inputRenderers').get(field.type)(field, this.options);
      }

      // custom inputRenderer
      if (schema && schema.get('inputRenderer') &&
          this.options.get('inputRenderers').get(schema.get('inputRenderer'))) {
        return this.options.get('inputRenderers').get(schema.get('inputRenderer'))(field, this.options);
      }
    }

    // console.log('props', props);
    return createElement(type, props);
  }

}
