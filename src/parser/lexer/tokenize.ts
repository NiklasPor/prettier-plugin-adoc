import { IToken, Lexer, MultiModesDefinition } from "chevrotain";
import {
  AttributeListMode,
  AttributeListStart,
  AttributeListTokens,
  LegacyIdMode,
  LegacyIdTokens,
} from "./attribute-list-tokens";

import {
  EmptyLine,
  Headline,
  Newline,
  Space,
  Tab,
  InlineText,
} from "./shared-token";
import { StringMode, StringTokens } from "./string-tokens";

const rootTokens = [
  Headline,
  AttributeListStart,
  Space,
  EmptyLine,
  Newline,
  Tab,
  InlineText,
];

const modes: MultiModesDefinition = {
  root: rootTokens,
  [AttributeListMode]: AttributeListTokens,
  [LegacyIdMode]: LegacyIdTokens,
  [StringMode]: StringTokens,
};
const lexer = new Lexer(
  {
    defaultMode: "root",
    modes,
  },
  { positionTracking: "full" }
);

const nonUniqueTokens = Object.values(modes).flat();
export const AllTokens = Array.from(new Set(nonUniqueTokens).values());

export function tokenize(text: string): IToken[] {
  return lexer.tokenize(text).tokens;
}
