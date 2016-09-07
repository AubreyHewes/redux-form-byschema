import Ajv from 'ajv';

let validator = {};

/**
 *
 * @param values
 * @param form
 *
 * @returns {{}}
 */
export const validate = (values, form) => {
  values = values['root'] || {};

  const errors = {};

  if (!validator[form.schema.hashCode()]) {
    try {
      // this is crappy but ajv is not immutable...
      validator[form.schema.hashCode()] = new Ajv({ allErrors: true }).compile(form.schema.toJS());
    } catch (e) {
      validator[form.schema.hashCode()] = function () {
        return true;
      };
    }
  }
  let valid = validator[form.schema.hashCode()](values);

  if (valid) {
    return errors;
  }
  const rootKeywords = ['required', 'dependencies', 'additionalProperties'];

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

    if (err.keyword === 'required') {
      nibble = nibble[err.params.missingProperty] = 'required';
    }
    if (err.keyword === 'dependencies') {
      nibble = nibble[err.params.missingProperty] = 'required';
    }
    if (err.keyword === 'additionalProperties') {
      nibble = nibble[err.params.additionalProperty] = err.message;
    }
    if (err.keyword === 'pattern') {
      nibble = nibble[property] = 'invalidpattern';
    }

    // todo this doesn't work... ref is still an object
    // nibble = err.message;
  });

  // console.log('valid', errors);
  return errors;
};

export default validate;
