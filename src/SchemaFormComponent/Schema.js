import { Component, createElement, PropTypes } from 'react';
import { propTypes } from 'redux-form';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

import Renderer from '../renderer/Schema';

/**
 * A SchemaForm React Component; returns a form using the configured props.schema
 *
 * Other options are:
 * setting a config (object)prop containing the following:
 */
export default class SchemaForm extends Component {
  static propTypes = {
    ... propTypes,
    children: PropTypes.any,
    config: PropTypes.object,
    path: PropTypes.array,
    schema: PropTypes.object
  };

  renderer = null;

  renderSchema (schema, values, config) {
    if (!this.renderer) {
      this.renderer = new Renderer(config);
      const me = this;
      this.renderer.setState = (state) => {
        me.setState(state);
      };
      this.renderer.getState = () => {
        return me.state;
      };
      this.renderer.removeField = (name) => {
        // console.log('removeField', me.props.form, name);
        return me.props.dispatch(me.props.change(name, {}));
        // return me.props.dispatch(unregisterField(me.props.form, name));
      };
      this.renderer.changeField = (name, value) => {
        // console.log('changeField', name, value);
        return me.props.dispatch(me.props.change(name, value));
      };
    }
    return this.renderer.renderObject(schema, this.props.path || [], values);
  }

  render () {
    const {
      /*eslint no-unused-vars:0*/
      // own
      schema, config, path, enableRecaptcha,
      customFormats, customKeywords,
      // redux-form
      anyTouched, asyncValidate, asyncValidating, destroy, dirty, dispatch, error, focus, handleSubmit, initialize,
      invalid, pristine, reset, submitting, submitFailed, touch, untouch, valid, initialValues, shouldAsyncValidate,
      validate, initialized, registeredFields, arrayMove, arrayRemoveAll, startAsyncValidation, startSubmit,
      stopAsyncValidation, stopSubmit, setSubmitFailed, updateSyncErrors, blur, change, array,
      triggerSubmit, clearSubmit, submit,
      clearFields, resetSection, clearAsyncError, resultMessage,
      //
      submitSucceeded, schemaCompileError, pure, autofill, clearSubmitErrors, warning,
      // rest
      ...rest
    } = this.props;

    return createElement('form', {
      ... rest,
      // onSubmitFail: () => console.log('failed', arguments),
      'data-role': 'form',
      'noValidate': true,
      children: [
        this.props.children,
        this.renderSchema(schema, {}, config),
        this.renderButtons(config)
      ]
    });
  };

  renderButtons (config) {
    let buttons = {
      'submit': true,
      'reset': true
    };

    if (config && config.buttons) {
      buttons = config.buttons;
    }

    let children = [];
    Object.keys(buttons).forEach((key) => {
      if (buttons[key] === false) {
        return;
      }
      children.push(this.renderButton(key, buttons[key]));
    });

    if (children.length === 0) {
      return null;
    }

    if (this.props.error) {
      children.push(createElement('div', {key: 'form-error', className: 'form-control-feedback'}, this.props.error));
    }

    const hasLabels = config.hasLabels || config.hasLabels === undefined;
    const wrapperClassName = hasLabels ? (config && config.buttonWrapperClass ? config.buttonWrapperClass : '')
      : (config && config.inputWrapperClass ? config.inputWrapperClass : '');

    return createElement('div', {
      key: 'schemaform-buttons',
      className: (config.groupClass || '') + ' form-group-buttons',
      children: createElement('div', {
        className: wrapperClassName + (this.props.error ? ' has-danger' : ''),
        children: children
      })
    });
  }

  renderButton (type, config) {
    let { text, ...props } = config;
    if (isBoolean(props)) {
      props = {};
    }

    // allow props to be a string or a React.Component
    if (isString(props) || props.isReactComponent /* TODO this should work !? */ || props.$$typeof) {
      text = props;
      props = {};
    }

    if (isObject(props)) {
    }

    // add default type; else the form will submit!
    if (!props.type) {
      props.type = 'button';
    }

    let deActivatePristine;

    // add submit behaviour
    if (type === 'submit') {
      props.key = 'submit';
      props.type = type;
      deActivatePristine = true;
      if (config === true) {
        props.children = 'Submit';
      }
    }

    // add reset behaviour
    if (type === 'reset') {
      props.key = 'reset';
      props.onClick = this.props.reset;
      deActivatePristine = true;
      if (config === true) {
        props.children = 'Reset';
      }
    }

    if (typeof props.disabled === 'undefined' && deActivatePristine) {
      props.disabled = this.props.submitting || this.props.pristine;
    }

    if (text) {
      props.children = text;
    }

    return createElement('button', {
      ... props
    });
  }

}
