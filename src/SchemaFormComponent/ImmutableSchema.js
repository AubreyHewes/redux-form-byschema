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
    }
    return this.renderer.renderObject(schema, [], values);
  }

}
