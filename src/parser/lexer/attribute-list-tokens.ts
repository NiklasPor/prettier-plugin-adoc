import { createToken } from "chevrotain";
import { Assignment, Comma } from "./shared-token";
import { StringStart } from "./string-tokens";

export const AttributeListMode = "AttributeListMode";
export const LegacyIdMode = "LegacyIdMode";

export const AttributeListStart = createToken({
  name: "AttributeListStart",
  pattern: /\[(?=.*?\])/,
  push_mode: AttributeListMode,
});

export const LegacyIdStart = createToken({
  name: "LegacyIdStart",
  pattern: /\[(?=.*?\])/,
  push_mode: LegacyIdMode,
});

export const LegacyIdEnd = createToken({
  name: "LegacyIdEnd",
  pattern: /\]/,
  pop_mode: true,
});

export const AttributeListEnd = createToken({
  name: "AttributeListEnd",
  pattern: /\]/,
  pop_mode: true,
});

export const AttributeInlineText = createToken({
  name: "AttributeInlineText",
  pattern: /[^\s,=\[\].%#]+/,
});

export const AttributeRoleShorthand = createToken({
  name: "AttributeRoleShorthand",
  pattern: /\./,
});

export const AttributeOptionShorthand = createToken({
  name: "AttributeOptionShorthand",
  pattern: /\%/,
});

export const AttributeIdShorthand = createToken({
  name: "AttributeIdShorthand",
  pattern: /\#/,
});

export const AttributeListTokens = [
  AttributeListEnd,
  LegacyIdStart,
  Comma,
  StringStart,
  Assignment,
  AttributeOptionShorthand,
  AttributeIdShorthand,
  AttributeRoleShorthand,
  AttributeInlineText,
];

export const LegacyIdTokens = [LegacyIdEnd, AttributeInlineText];
