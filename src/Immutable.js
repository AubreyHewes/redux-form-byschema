import Renderer from "./renderer/ImmutableSchema";
import Validator from "./validator/Schema"; // redux-form does not support an immutable for validation
import SchemaForm from "./SchemaFormComponent/ImmutableSchema";

/**
 * Wrapper for easy access
 *
 * @param schema
 * @param values
 * @param options
 */
export const render = (schema, values, options) => new Renderer(options).renderObject(schema, [], values);

/**
 *
 */
export const validate = Validator;

/**
 *
 */
export default SchemaForm;
