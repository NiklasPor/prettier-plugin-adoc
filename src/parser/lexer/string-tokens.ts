import { createToken } from "chevrotain";
import { Space, InlineText } from "./shared-token";

export const StringMode = "StringMode";

export const StringStart = createToken({
  name: "StringStart",
  pattern: /"(?=.*")/,
  push_mode: StringMode,
});

export const StringEnd = createToken({
  name: "StringEnd",
  pattern: /"/,
  pop_mode: true,
});

export const StringText = createToken({
  name: "StringText",
  pattern: /[^"\s]+/,
});

export const StringTokens = [StringEnd, StringText, Space];
