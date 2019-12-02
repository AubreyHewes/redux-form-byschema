import React from "react";
import JsonView from "./components/JsonView";

export default {
  title: "Misc|JSON View"
};

export const AString = () => <JsonView value={"string"} />;
export const ANumber = () => <JsonView value={42} />;
export const ABoolean = () => <JsonView value={true} />;
export const AnArray = () => <JsonView value={[1, true, "three"]} />;
export const AnObject = () => (
  <JsonView
    value={{
      objProp1: "string",
      objProp2: 42,
      objProp3: true,
      objProp4: false,
      objProp5: [1, "two", true, false],
      objProp6: {
        objProp1: "string",
        objProp2: 42,
        objProp3: true,
        objProp4: false,
        objProp5: [1, "two", true, false],
        objProp6: {
          objProp1: "string",
          objProp2: 42,
          objProp3: true,
          objProp4: false,
          objProp5: [1, "two", true, false]
        }
      }
    }}
  />
);
