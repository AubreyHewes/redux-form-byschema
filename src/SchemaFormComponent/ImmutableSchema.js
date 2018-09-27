/* eslint no-unused-vars:0 */
import { Component, createElement, PropTypes } from 'react';
import BasicSchemaForm from './Schema';
import Renderer from '../renderer/ImmutableSchema';
import { fromJS as ImmutableFromJS } from 'immutable';

/**
 * A SchemaForm React Component; returns a form using the configured props.schema
 *
 * Other options are:
 * setting a config (object)prop containing the following:
 *
 */
export default class SchemaForm extends BasicSchemaForm {
  renderSchema (schema, values, config) {
    if (!this.renderer) {
      this.renderer = new Renderer(ImmutableFromJS(config));
      const me = this;

      this.renderer.formProps = this.props;
      // console.log('props', this.props);

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
    if (schema.get('type') === 'array') {
      return this.renderer.renderArray(schema, this.props.path || [], values);
    }
    // console.log('props', this.props);
    return this.renderer.renderObject(schema, this.props.path || [], values);
  }
}
