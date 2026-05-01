import { createTableHook } from "./_helpers.js";

export const useCapitalItems = createTableHook("capital_items", {
  orderBy: "name",
});
