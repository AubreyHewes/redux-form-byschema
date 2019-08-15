import test from "ava";

import Immutable from "immutable";
import validate from "../src/validator/Schema";

global.__DEBUG__ = false; // eslint-disable-line no-unused-vars

test("no constraints; should be valid", t => {
  t.deepEqual(
    validate(
      {},
      {
        schema: new Immutable.Map({
          type: "object",
          properties: {
            test: {
              type: "string"
            }
          }
        })
      }
    ),
    {}
  );
});

test("required constraint; should be valid", t => {
  t.deepEqual(
    validate(
      {},
      {
        schema: new Immutable.Map({
          type: "object",
          properties: {
            test: {
              type: "string"
            }
          },
          required: ["test"]
        })
      }
    ),
    { root: { test: "required" } }
  );
});

test("pattern constraint; should be valid", t => {
  t.deepEqual(
    validate(
      {
        root: {
          test: "a"
        }
      },
      {
        schema: new Immutable.Map({
          type: "object",
          properties: {
            test: {
              type: "string",
              pattern: "^[A-Z]$"
            }
          },
          required: ["test"]
        })
      }
    ),
    { root: { test: "pattern" } }
  );
});

// test("dependency constraint; should be valid", t => {
//   t.deepEqual(
//     validate(
//       {
//         root: {
//           test: "a"
//         }
//       },
//       {
//         schema: new Immutable.Map({
//           type: "object",
//           properties: {
//             test: {
//               type: "string"
//             }
//           },
//           dependencies: {
//             test: {}
//           }
//         })
//       }
//     ),
//     { root: { test: "invalidpattern" } }
//   );
// });
