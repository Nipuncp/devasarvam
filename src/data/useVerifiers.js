import { createTableHook } from "./_helpers.js";

export const useVerifiers = createTableHook("verifiers", {
  orderBy: "sort_order",
});
