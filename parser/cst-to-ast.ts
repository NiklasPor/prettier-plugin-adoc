import { CstElement, CstNode, IToken, TokenType } from "chevrotain";
import {
  AdocNode,
  AttributeBlockNode,
  AttributeListNode,
  AttributeNode,
  AttributeValueNode,
  EmptyLineNode,
  HeadlineNode,
  ParagraphNode,
  TextNode,
} from "./nodes";
import { CSTRule, Rules } from "./parse-to-cst";

import { Headline, Space, InlineText } from "./lexer/shared-token";
import {
  AttributeIdShorthand,
  AttributeInlineText,
  AttributeOptionShorthand,
  AttributeRoleShorthand,
} from "./lexer/attribute-list-tokens";
import { StringText } from "./lexer/string-tokens";

class CSTVisitor implements Record<CSTRule, (node: CstNode) => AdocNode> {
  visit(node: CstNode): AdocNode {
    return this[node.name as CSTRule](node);
  }

  [Rules.Adoc](node: CstNode): AdocNode {
    return {
      type: "adoc",
      location: this.location(node),
      children: this.childNodes(node).map((child) => this.visit(child)),
    };
  }

  [Rules.Headline](node: CstNode): HeadlineNode {
    const headline = this.getToken(node, Headline)?.image ?? "";
    return {
      type: "headline",
      level: headline.replace("\n", "").length - 1,
      location: this.location(node),
      text: this.TextRule(this.getNode(node, Rules.Text)!),
    };
  }

  [Rules.EmptyLine](node: CstNode): EmptyLineNode {
    return {
      type: "emptyLine",
      location: this.location(node),
    };
  }

  [Rules.AttributeList](node: CstNode): AttributeListNode {
    return {
      type: "attributeList",
      location: this.location(node),
      attributes: this.childNodes(node).map(
        (child) => this.visit(child) as AttributeNode
      ),
    };
  }

  [Rules.AttributeBlock](node: CstNode): AttributeBlockNode {
    return {
      type: "attributeBlock",
      location: this.location(node),
      list: this.AttributeList(this.getNode(node, Rules.AttributeList)),
    };
  }

  [Rules.AttributeEntry](node: CstNode): AttributeNode {
    const valueNode = this.getNode(node, Rules.AttributeValue);
    return {
      type: "attributeNode",
      location: this.location(node),
      key: this.getToken(node, AttributeInlineText)?.image,
      value: this.AttributeValue(valueNode),
    };
  }

  [Rules.AttributeEntryShorthand](node: CstNode): AttributeNode {
    const key =
      (this.getToken(node, AttributeIdShorthand) && "id") ??
      (this.getToken(node, AttributeOptionShorthand) && "option") ??
      (this.getToken(node, AttributeRoleShorthand) && "role");

    const values = this.childTokens(node)
      .filter((child) => child.tokenType === AttributeInlineText)
      .map((child) => child.image);

    return {
      type: "attributeNode",
      location: this.location(node),
      key,
      value: {
        location: this.location(node),
        type: "attributeValueNode",
        values,
      },
    };
  }

  [Rules.AttributeValue](node: CstNode): AttributeValueNode {
    const valueTokens = [StringText, AttributeInlineText];
    const values = this.childTokens(node)
      .filter((token) => valueTokens.includes(token.tokenType))
      .map((token) => token.image);

    return {
      type: "attributeValueNode",
      location: this.location(node),
      values,
    };
  }

  [Rules.Paragraph](node: CstNode): ParagraphNode {
    return {
      type: "paragraph",
      location: this.location(node),
      lines: this.childNodes(node).map((child) => this.TextRule(child)),
      isLiteral: !!this.getToken(node, Space),
    };
  }

  [Rules.Text](node: CstNode): TextNode {
    const texts = this.childTokens(node)
      .filter((token) => token.tokenType === InlineText)
      .map((token) => token.image);

    return {
      type: "text",
      location: this.location(node),
      text: texts,
    };
  }

  private getToken(node: CstNode, token: TokenType): IToken | undefined {
    const result = node.children[token.name]?.[0];
    if (result && "tokenType" in result) {
      return result;
    }

    return undefined;
  }

  private getNode(node: CstNode, rule: CSTRule): CstNode | undefined {
    const result = node.children[rule]?.[0];
    if (result && "children" in result) {
      return result;
    }

    return undefined;
  }

  private location(node: CstNode): AdocNode["location"] {
    if (!node.location) {
      throw new Error(`Missing location on CST node "${node.name}".`);
    }

    if (!node.location.endOffset || !node.location.startOffset) {
      return { start: -1, end: -1 };
    }

    return { start: node.location.startOffset, end: node.location.endOffset };
  }

  private childNodes(node: CstNode): CstNode[] {
    const childValues = Object.values(node.children);
    const children = childValues.flat();

    return children
      .filter((child): child is CstNode => "location" in child)
      .sort((a, b) => this.getStart(a) - this.getStart(b));
  }

  private childTokens(node: CstNode): IToken[] {
    const childValues = Object.values(node.children);
    const children = childValues.flat();

    return children
      .filter((child): child is IToken => "image" in child)
      .sort((a, b) => this.getStart(a) - this.getStart(b));
  }

  private getStart(element: CstElement) {
    if ("location" in element && element.location) {
      return element.location.startOffset;
    }

    if ("startOffset" in element) {
      return element.startOffset;
    }

    throw new Error("Couldn't resolve start of CSTElement.");
  }

  private getEnd(element: CstElement) {
    if (
      "location" in element &&
      element.location &&
      element.location.endOffset
    ) {
      return element.location.endOffset;
    }

    if ("endOffset" in element) {
      return element.endOffset;
    }

    throw new Error("Couldn't resolve start of CSTElement.");
  }
}

const visitor = new CSTVisitor();
export function cstToAst(cst: CstNode): AdocNode {
  return visitor.visit(cst);
}
