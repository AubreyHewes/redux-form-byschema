import { fromJS as ImmutableFromJS } from "immutable";
import SchemaForm from "./SchemaForm";
import renderer from "./SchemaForm/renderer";

export validate from "./SchemaForm/validator";

/**
 * Wrapper for easy access
 *
 * @param schema
 * @param values
 * @param options
 */
export const render = (schema, values, options) => renderer(ImmutableFromJS(schema || {}), values, options);

/**
 * Renderer for a react-redux (v6) form via a JSON Schema
 *
 * Basic HTML is generated; Style yourself!
 */
export default SchemaForm;
