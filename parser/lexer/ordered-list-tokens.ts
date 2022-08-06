import { createToken } from "chevrotain";

export const OrderedListItem = createToken({
  name: "OrderedListItem",
  pattern: /\n\.+/,
});
