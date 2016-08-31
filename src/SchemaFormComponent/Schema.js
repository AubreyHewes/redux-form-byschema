import { Component, createElement, PropTypes } from 'react';
import { propTypes } from 'redux-form';
import { isBoolean, isString, mapObject, isObject } from 'underscore';
import Renderer from '../renderer/Schema';

/**
 * A SchemaForm React Component; returns a form using the configured props.schema
 *
 * Other options are:
 * setting a config (object)prop containing the following:
 *
 *
 */
export default class SchemaForm extends Component {
  static propTypes = {
    ... propTypes,
    children: PropTypes.any,
    config: PropTypes.object,
    schema: PropTypes.object
  };

  renderer = null;

  renderSchema (schema, values, config) {
    if (!this.renderer) {
      this.renderer = new Renderer(config);
    }
    return this.renderer.renderObject(schema, [], values);
  }

  render () {
    const {
      /*eslint no-unused-vars:0*/
      // own
      schema, config,
      // redux-form
      anyTouched, asyncValidate, asyncValidating, destroy, dirty, dispatch, error, focus, handleSubmit, initialize,
      invalid, pristine, reset, submitting, submitFailed, touch, untouch, valid, initialValues, shouldAsyncValidate,
      validate, initialized, registeredFields, arrayMove, arrayRemoveAll, startAsyncValidation, startSubmit,
      stopAsyncValidation, stopSubmit, setSubmitFailed, updateSyncErrors, blur, change, array,
      // rest
      ...rest
    } = this.props;
    return createElement('form', {
      ... rest,
      'data-role': 'form',
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
    mapObject(buttons, (value, key) => {
      if (value === false) {
        return;
      }
      children.push(this.renderButton(key, value));
    });

    if (children.length === 0) {
      return null;
    }

    const hasLabels = config.hasLabels || config.hasLabels === undefined;
    const wrapperClassName = hasLabels ? (config && config.buttonWrapperClass ? config.buttonWrapperClass : '')
      : (config && config.inputWrapperClass ? config.inputWrapperClass : '');

    return createElement('div', {
      className: (config.groupClass || '') + ' form-group-buttons',
      children: [createElement('div', {
        className: wrapperClassName,
        children: children
      })]
    });
  };

  renderButton (type, config) {
    // console.log('renderButton', type, config);

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
      props.type = type;
      deActivatePristine = true;
      if (config === true) {
        props.children = ['Submit'];
      }
    }

    // add reset behaviour
    if (type === 'reset') {
      props.onClick = this.props.reset;
      deActivatePristine = true;
      if (config === true) {
        props.children = ['Reset'];
      }
    }

    // console.log(this.props);
    // console.log(props);
    if (!props.disabled && deActivatePristine) {
      props.disabled = this.props.submitting || this.props.pristine;
    }

    if (text) {
      props.children = [text];
    }

    return createElement('button', {
      ... props
    });
  }

}
