// import React from 'react';
// import {
//   renderIntoDocument,
//   findRenderedDOMComponentWithClass,
//   findRenderedDOMComponentWithTag,
//   Simulate
// } from 'react-addons-test-utils';
import { expect } from 'chai';
import validate from '../src/validator/Schema';
import Immutable from 'immutable';

describe('validate', function () {
  it('no constraints; should be valid', function () {
    const result = validate({}, {schema: new Immutable.Map({
      'type': 'object',
      'properties': {
        'test': {
          'type': 'string'
        }
      }
    })});
    expect(result).to.deep.equal({});
  });

  it('required constraint; should be valid', function () {
    const result = validate({}, {schema: new Immutable.Map({
      'type': 'object',
      'properties': {
        'test': {
          'type': 'string'
        }
      },
      'required': [
        'test'
      ]
    })});
    expect(result).to.deep.equal({'root': {'test': 'required'}});
  });

  it('pattern constraint; should be valid', function () {
    const result = validate({
      'root': {
        'test': 'a'
      }
    }, {schema: new Immutable.Map({
      'type': 'object',
      'properties': {
        'test': {
          'type': 'string',
          'pattern': '^[A-Z]$'
        }
      },
      'required': [
        'test'
      ]
    })});
    expect(result).to.deep.equal({'root': {'test': 'invalidpattern'}});
  });

  // it('dependency constraint; should be valid', function () {
  //   const result = validate({
  //     'root': {
  //       'test': 'a'
  //     }
  //   }, {schema: new Immutable.Map({
  //     'type': 'object',
  //     'properties': {
  //       'test': {
  //         'type': 'string'
  //       }
  //     },
  //     'dependencies': {
  //       'test': {}
  //     }
  //   })});
  //   expect(result).to.deep.equal({'root': {'test': 'invalidpattern'}});
  // });
});
