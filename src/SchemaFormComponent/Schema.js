import { Component, createElement, PropTypes } from 'react';
import { propTypes } from 'redux-form';
import { isBoolean, isString, mapObject, isObject } from 'underscore';
import Renderer from '../renderer/Schema';
import ReCaptcha from 'react-google-recaptcha';

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
    path: PropTypes.array,
    schema: PropTypes.object
  };

  renderer = null;

  // shouldComponentUpdate (nextProps, nextState) {
  //   console.log(nextProps, nextState);
  //   return nextProps.dirty;
  // }

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
      // redux-form
      anyTouched, asyncValidate, asyncValidating, destroy, dirty, dispatch, error, focus, handleSubmit, initialize,
      invalid, pristine, reset, submitting, submitFailed, touch, untouch, valid, initialValues, shouldAsyncValidate,
      validate, initialized, registeredFields, arrayMove, arrayRemoveAll, startAsyncValidation, startSubmit,
      stopAsyncValidation, stopSubmit, setSubmitFailed, updateSyncErrors, blur, change, array,
      //
      submitSucceeded, schemaCompileError, pure, autofill,
      // rest
      ...rest
    } = this.props;
    return createElement('form', {
      ... rest,
      'data-role': 'form',
      children: [
        this.props.children,
        this.renderSchema(schema, {}, config),
        this.renderReCaptcha(config),
        this.renderButtons(config)
      ]
    });
  };

  renderReCaptcha (config) { // offset-sm-4 col-sm-8 col-xs-12
    return config.reCaptchaSiteKey ? createElement(ReCaptcha, {
      className: config.buttonWrapperClass ? 'recaptcha ' + config.buttonWrapperClass : 'recaptcha',
      sitekey: config.reCaptchaSiteKey,
      onChange: (value) => {
        // console.log('reCaptcha', value);
        this.props.dispatch(this.props.change('root.recaptcha', value));
      }
    }) : null;
  }

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
