import { fromJS as ImmutableFromJS } from "immutable";
import SchemaForm, { render as renderSchema, validate as validateSchema } from "./Immutable";

/**
 * Wrapper for easy access
 *
 * @param schema
 * @param values
 * @param options
 */
export const render = (schema, values, options) => renderSchema(ImmutableFromJS(schema || {}), values, options);

/**
 *
 */
export const validate = validateSchema;

/**
 * Renderer for a react-redux (v6) form via a JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default SchemaForm;
