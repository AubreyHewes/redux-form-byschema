/*eslint no-unused-vars:0*/
import { Component, createElement, PropTypes } from 'react';
import BasicSchemaForm from './Schema';
import Renderer from '../renderer/ImmutableSchema';
import { Map as ImmutableMap } from 'immutable';

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
      this.renderer = new Renderer(new ImmutableMap(config));
      const me = this;
      this.renderer.setState = (state) => {
        me.setState(state);
      };
      this.renderer.getState = () => {
        return me.state;
      };
      this.renderer.changeField = (name, value) => {
        // console.log('changeField', name, value);
        return me.props.dispatch(me.props.change(name, value));
      };
    }
    if (schema.get('type') === 'array') {
      return this.renderer.renderArray(schema, this.props.path || [], values);
    }
    return this.renderer.renderObject(schema, this.props.path || [], values);
  }

}
