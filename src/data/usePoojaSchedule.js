import { createTableHook } from "./_helpers.js";

export const usePoojaSchedule = createTableHook("pooja_schedule", {
  orderBy: "time",
});
