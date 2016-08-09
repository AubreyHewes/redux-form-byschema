import Ajv from 'ajv';

/**
 *
 * @param values
 * @param form
 *
 * @returns {{}}
 */
export const validate = (values, form) => {
  values = values['root'];

  const errors = {};

  let validate = Ajv({allErrors: true}).compile(form.schema.toJS()); // this is crappy but ajv is not immutable...?!
  let valid = validate(values);

  if (!valid) {
    errors.root = {};
    validate.errors.map((err) => {
      let nibble = errors.root;
      err.dataPath.split('.').slice(1).forEach((path) => {
        nibble[path] = {};
        nibble = nibble[path];
      });
      nibble = err.message;
    });
  }

  console.log(valid, validate.errors);
  console.log(errors);
  return {};
};
