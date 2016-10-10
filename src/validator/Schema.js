import Ajv from 'ajv';
import { isObject } from 'underscore';

let validator = {};

/**
 *
 * @param values
 * @param form
 * @param customKeywords
 * @param customFormats
 *
 * @returns {{}}
 */
export const validate = (values, form, customKeywords, customFormats) => {
  values = JSON.parse(JSON.stringify(values['root'] || {}), (k, v) => (k === 'renderOneOf') ? undefined : v);

  if (__DEBUG__) {
    console.log('validate', values);
  }
  const errors = {};

  if (!validator[form.schema.hashCode()]) {
    try {
      // this is crappy but ajv is not immutable...
      let ajv = new Ajv({ allErrors: true });
      if (customKeywords) {
        Object.keys(customKeywords).forEach((key) => {
          if (customKeywords[key].validate) {
            ajv.addKeyword(key, customKeywords[key]);
          }
        });
      }
      if (customFormats) {
        Object.keys(customFormats).forEach((key) => {
          ajv.addFormat(key, customFormats[key]);
        });
      }
      validator[form.schema.hashCode()] = ajv.compile(form.schema.toJS());
    } catch (e) {
      validator[form.schema.hashCode()] = function () {
        return true;
      };
    }
  }
  let valid = validator[form.schema.hashCode()](values);

  // console.log('errors', validator[form.schema.hashCode()].errors);
  if (valid) {
    return errors;
  }

  if (__DEBUG__) {
    console.log(valid, validator[form.schema.hashCode()].errors);
  }

  const rootKeywords = ['required', 'dependencies', 'additionalProperties', 'oneOf'];

  errors.root = {};

  validator[form.schema.hashCode()].errors.map((err) => {
    // console.log(err);
    let nibble = errors.root;
    let path = err.dataPath.split('.').slice(1);

    // get property
    let property = null;
    if (rootKeywords.indexOf(err.keyword) === -1) {
      property = path.pop();
    }

    // build path
    path.forEach((path) => {
      nibble = nibble[path] = !nibble[path] ? {} : nibble[path];
    });

    // if (err.dataPath === '.business.invoice.invoiceFields.address') {
    //   console.log('nibble', nibble);
    // }

    if (err.keyword === 'required') {
      if (!isObject(nibble)) {
        nibble = {};
      }
      // if (err.dataPath === '.business.invoice.invoiceFields.address') {
      //   console.log('nibble', nibble);
      //   console.log('err', err);
      // }
      nibble = nibble[err.params.missingProperty] = 'required';
    }
    if (err.keyword === 'dependencies') {
      if (!isObject(nibble)) {
        nibble = {};
      }
      nibble = nibble[err.params.missingProperty] = 'required';
    }
    // if (err.keyword === 'additionalProperties') {
    //   if (!isObject(nibble)) {
    //     nibble = {};
    //   }
    //   nibble = nibble[err.params.additionalProperty] = err.message;
    // }
    if (err.keyword === 'pattern') {
      if (!isObject(nibble)) {
        nibble = {};
      }
      nibble = nibble[property] = 'invalidpattern';
    }

    if (err.keyword === 'oneOf') {
      if (!isObject(nibble)) {
        nibble = {};
      }
      if (Object.keys(nibble).length > 0) {
        console.log(nibble);
        return;
      }
      nibble = nibble['renderOneOf'] = 'required';
    }

    // todo this doesn't work... ref is still an object
    // nibble = err.message;
  });

  if (__DEBUG__) {
    console.log('errors', errors);
  }
  return errors;
};

export default validate;
