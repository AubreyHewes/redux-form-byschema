import Ajv from "ajv/lib/ajv";
import isObject from "lodash/isObject";

const validator = {};

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
  values = JSON.parse(JSON.stringify(values["root"] || {}), (k, v) => (k === "renderOneOf" ? undefined : v));

  if (__DEBUG__) {
    console.log("validate", values);
  }
  const errors = {};

  if (!validator[form.schema.hashCode()]) {
    try {
      // this is crappy but ajv is not immutable...
      const ajv = new Ajv({ allErrors: true });
      if (customKeywords) {
        Object.keys(customKeywords).forEach(key => {
          if (customKeywords[key].validate) {
            ajv.addKeyword(key, customKeywords[key]);
          }
        });
      }
      if (customFormats) {
        Object.keys(customFormats).forEach(key => {
          ajv.addFormat(key, customFormats[key]);
        });
      }
      validator[form.schema.hashCode()] = ajv.compile(form.schema.toJS());
    } catch (e) {
      validator[form.schema.hashCode()] = function() {
        return true;
      };
    }
  }
  const valid = validator[form.schema.hashCode()](values);

  // console.log('errors', validator[form.schema.hashCode()].errors);
  if (valid) {
    return errors;
  }

  if (__DEBUG__) {
    console.log(valid, validator[form.schema.hashCode()].errors);
  }

  const rootKeywords = ["required", "dependencies", "additionalProperties", "oneOf", "validator"];

  errors.root = {};

  validator[form.schema.hashCode()].errors.map(err => {
    // console.log(err);
    let nibble = errors.root;
    const path = err.dataPath
      .replace(/\[([0-9]+)]/m, ".$1")
      .split(".")
      .slice(1);

    // get property
    let property = null;
    let message = null;

    if (rootKeywords.indexOf(err.keyword) === -1) {
      property = path.pop();
    }

    // build path
    path.forEach(path => {
      nibble = nibble[path] = !nibble[path] ? {} : nibble[path];
    });

    if (err.keyword === "required" || err.keyword === "dependencies") {
      property = err.params.missingProperty;
    }

    if (err.keyword === "oneOf") {
      if (!isObject(nibble)) {
        nibble = {};
      }
      if (Object.keys(nibble).length > 0) {
        return;
      }
      property = "renderOneOf";
      message = "required";
    }

    if (err.keyword === "minLength" && err.params.limit === 1) {
      message = "required";
    }

    if (err.keyword === "validator") {
      // eslint-disable-next-line prefer-destructuring
      property = err.params.property;
      // eslint-disable-next-line prefer-destructuring
      message = err.message;
    }

    nibble = nibble[property] = message || err.keyword;
  });

  if (__DEBUG__) {
    console.log("errors", errors);
  }
  return errors;
};

export default validate;
