import { createToken } from "chevrotain";

export const UnorderedListItem = createToken({
  name: "UnorderedListItem",
  pattern: /\n\*+/,
});
