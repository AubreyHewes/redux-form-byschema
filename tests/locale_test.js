// import React from 'react';
// import {
//   renderIntoDocument,
//   findRenderedDOMComponentWithClass,
//   findRenderedDOMComponentWithTag,
//   Simulate
// } from 'react-addons-test-utils';
import { expect } from 'chai';
import Locale from '../src/i18n/LocaleBase';

describe('locale', function () {
  const locale = new Locale();
  locale.strings = {'known': '@known'};

  it('unknown key should return key', function () {
    expect(locale.getString('unknown')).to.equal('unknown');
  });

  it('known key should return value', function () {
    expect(locale.getString('known')).to.equal('@known');
  });
});
