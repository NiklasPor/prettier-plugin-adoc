import { CstParser, IToken } from "chevrotain";
import { AllTokens } from "./lexer/tokenize";

import {
  AttributeIdShorthand,
  AttributeInlineText,
  AttributeListEnd,
  AttributeListStart,
  AttributeOptionShorthand,
  AttributeRoleShorthand,
  LegacyIdEnd,
  LegacyIdStart,
} from "./lexer/attribute-list-tokens";
import {
  Assignment,
  Comma,
  EmptyLine,
  Headline,
  InlineText,
  Newline,
  Space,
} from "./lexer/shared-token";
import { StringEnd, StringStart, StringText } from "./lexer/string-tokens";

export const Rules = {
  Text: "TextRule",
  Paragraph: "ParagraphRule",
  Headline: "HeadlineRule",
  EmptyLine: "EmptyLineRule",
  AttributeList: "AttributeList",
  AttributeBlock: "AttributeBlock",
  AttributeEntry: "AttributeEntry",
  AttributeEntryShorthand: "AttributeEntryShorthand",
  AttributeValue: "AttributeValue",
  Adoc: "AdocRule",
} as const;
export type CSTRule = typeof Rules[keyof typeof Rules];

class AdocParser extends CstParser {
  constructor() {
    super(AllTokens, { nodeLocationTracking: "full" });
    this.performSelfAnalysis();
  }

  private text = this.RULE(Rules.Text, () =>
    this.AT_LEAST_ONE(() => {
      this.CONSUME(InlineText);
      this.OPTION(() => this.CONSUME1(Space));
    })
  );

  private headline = this.RULE(Rules.Headline, () => {
    this.CONSUME(Newline);
    this.CONSUME(Headline);
    this.MANY(() => this.CONSUME(Space));
    this.SUBRULE(this.text);
  });

  private emptyLine = this.RULE(Rules.EmptyLine, () => {
    this.CONSUME(EmptyLine);
  });

  private paragraph = this.RULE(Rules.Paragraph, () => {
    this.AT_LEAST_ONE(() => {
      this.CONSUME(Newline);
      this.MANY(() => this.CONSUME1(Space));
      this.SUBRULE(this.text);
    });
  });

  private attributeValue = this.RULE(Rules.AttributeValue, () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME1(StringStart);
          this.MANY_SEP({
            SEP: Space,
            DEF: () => this.CONSUME2(StringText),
          });
          this.CONSUME3(StringEnd);
        },
      },
      { ALT: () => this.CONSUME4(AttributeInlineText) },
    ]);
  });

  private attributeEntry = this.RULE(Rules.AttributeEntry, () => {
    this.OPTION(() => {
      this.CONSUME(AttributeInlineText);
      this.CONSUME(Assignment);
    });
    this.SUBRULE1(this.attributeValue);
  });

  private shorthandAttributeEntry = this.RULE(
    Rules.AttributeEntryShorthand,
    () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME1(LegacyIdStart);
            this.CONSUME2(AttributeInlineText);
            this.CONSUME1(LegacyIdEnd);
          },
        },
        {
          ALT: () =>
            this.AT_LEAST_ONE(() => {
              this.CONSUME5(AttributeIdShorthand);
              this.CONSUME6(AttributeInlineText);
            }),
        },
        {
          ALT: () =>
            this.AT_LEAST_ONE1(() => {
              this.CONSUME7(AttributeRoleShorthand);
              this.CONSUME8(AttributeInlineText);
            }),
        },
        {
          ALT: () =>
            this.AT_LEAST_ONE2(() => {
              this.CONSUME9(AttributeOptionShorthand);
              this.consume(10, AttributeInlineText);
            }),
        },
      ]);
    }
  );

  private attributeBlock = this.RULE(Rules.AttributeBlock, () => {
    this.CONSUME(Newline);
    this.SUBRULE(this.attributeList);
  });

  private attributeList = this.RULE(Rules.AttributeList, () => {
    this.CONSUME1(AttributeListStart);
    this.MANY(() =>
      this.OR([
        { ALT: () => this.SUBRULE(this.shorthandAttributeEntry) },
        {
          ALT: () =>
            this.MANY_SEP({
              DEF: () => this.SUBRULE(this.attributeEntry),
              SEP: Comma,
            }),
        },
      ])
    );
    this.CONSUME2(AttributeListEnd);
  });

  adoc = this.RULE(Rules.Adoc, () =>
    this.MANY(() =>
      this.OR([
        { ALT: () => this.SUBRULE1(this.headline) },
        { ALT: () => this.SUBRULE4(this.attributeBlock) },
        { ALT: () => this.SUBRULE2(this.paragraph) },
        { ALT: () => this.SUBRULE3(this.emptyLine) },
      ])
    )
  );
}

const parser = new AdocParser();
export function parseToCST(tokens: IToken[]) {
  parser.input = tokens;
  const result = parser.adoc();
  const error = parser.errors[0];

  if (error) {
    throw error;
  }

  return result;
}
