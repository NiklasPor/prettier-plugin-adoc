import { createToken } from "chevrotain";

export const Headline = createToken({
  name: "Headline",
  pattern: /(?<=\n)=+/,
  start_chars_hint: ["="],
  line_breaks: false,
});

export const Newline = createToken({
  name: "NewLine",
  pattern: /\n/,
});

export const EmptyLine = createToken({
  name: "EmptyLine",
  pattern: /\n[ \t]*(?=\n)/,
});

export const Space = createToken({
  name: "Space",
  pattern: / /,
});

export const Comma = createToken({
  name: "Comma",
  pattern: /,/,
});

export const Assignment = createToken({
  name: "Assignment",
  pattern: /=/,
});

export const Tab = createToken({
  name: "Tab",
  pattern: /\t/,
});

export const InlineText = createToken({
  name: "InlineText",
  pattern: /\S+/,
});
