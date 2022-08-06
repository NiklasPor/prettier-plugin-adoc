import {
  doc,
  Parser,
  ParserOptions,
  Printer,
  SupportLanguage,
  SupportOption,
} from "prettier";
import { AdocNode, AttributeNode, TextNode } from "./parser/nodes";
import { parse } from "./parser/parse";

export const PLUGIN_KEY = "asciidoc";

interface AdocParserOptions {
  adocLiteralParagraphSpaces: number;
  adocVerbose: boolean;
  adocAlwaysQuoteAttributeValues: boolean;
  adocIdFormat: "shorthand" | "formal";
  adocOptionFormat: "shorthand" | "formal";
  adocRoleFormat: "shorthand" | "formal";
}
export type PrettierAdocParserOptions = ParserOptions<AdocNode> &
  AdocParserOptions;

function getAdocOptions(options: ParserOptions<AdocNode>) {
  return options as PrettierAdocParserOptions & ParserOptions<AdocNode>;
}

const parser: Parser<AdocNode> = {
  astFormat: PLUGIN_KEY,
  parse: (text, _, options) => parse(text, getAdocOptions(options).adocVerbose),
  locStart: (node) => node.location.start,
  locEnd: (node) => node.location.end,
};

const printer: Printer<AdocNode> = {
  print: (path, options, print, args?): doc.builders.Doc => {
    const {
      adocLiteralParagraphSpaces,
      adocAlwaysQuoteAttributeValues,
      adocIdFormat,
      adocOptionFormat,
      adocRoleFormat,
    } = options as unknown as PrettierAdocParserOptions;
    const node = path.getValue();

    switch (node?.type) {
      case undefined:
        return "";
      case "adoc":
        const children = doc.utils.removeLines(path.map(print, "children"));
        const parts = doc.utils.getDocParts(doc.utils.normalizeDoc(children));

        return doc.utils.normalizeDoc([
          (parts as doc.builders.Doc[]).slice(1),
          doc.builders.hardline,
        ]);
      case "headline":
        return [
          doc.builders.hardline,
          "=".repeat(node.level + 1),
          " ",
          printText(node.text),
        ];
      case "text":
        return printText(node);
      case "paragraph":
        return path
          .map(print, "lines")
          .map((line) => [
            doc.builders.hardline,
            node.isLiteral ? " ".repeat(adocLiteralParagraphSpaces) : "",
            line,
          ]);
      case "emptyLine":
        return doc.builders.hardline;
      case "attributeBlock":
        return [doc.builders.hardline, path.call(print, "list")];
      case "attributeList":
        const ids =
          adocIdFormat === "shorthand"
            ? node.attributes.filter((attr) => attr.key === "id")
            : [];

        const roles =
          adocRoleFormat === "shorthand"
            ? node.attributes.filter((attr) => attr.key === "role")
            : [];
        const options =
          adocOptionFormat === "shorthand"
            ? node.attributes.filter((attr) => attr.key === "option")
            : [];

        const others = node.attributes
          .filter((attr) => !ids.includes(attr))
          .filter((attr) => !roles.includes(attr))
          .filter((attr) => !options.includes(attr));

        const printedShorthands = [
          ids.map((id) => printAttributeShorthand(id, "#")),
          roles.map((role) => printAttributeShorthand(role, ".")),
          options.map((option) => printAttributeShorthand(option, "%")),
        ].flat();

        const printedFormals = others.map((attr) =>
          printAttributeFormal(attr, adocAlwaysQuoteAttributeValues)
        );

        return [
          "[",
          doc.builders.join(",", printedFormals),
          printedShorthands,
          "]",
        ];
      case "attributeNode":
        const prefix = node.key && `${node.key}=`;
        return [prefix ?? "", path.call(print, "value")];
      case "attributeValueNode":
        const printedValues = node.values.join(" ");
        const wrapChar =
          adocAlwaysQuoteAttributeValues || attributeQuotesNeeded(node.values)
            ? '"'
            : "";

        return `${wrapChar}${printedValues}${wrapChar}`;
      default:
        console.error(
          `Encountered unknown node of type "${(node as AdocNode).type}".`
        );
        return "";
    }
  },
};

function printAttributeFormal(
  node: AttributeNode,
  alwaysQuote: boolean
): doc.builders.Doc {
  const prefix = node.key && `${node.key}=`;
  const printedValues = node.value.values.join(" ");
  const wrapChar =
    alwaysQuote || attributeQuotesNeeded(node.value.values) ? '"' : "";

  return [prefix ?? "", `${wrapChar}${printedValues}${wrapChar}`];
}

function printAttributeShorthand(
  node: AttributeNode,
  shorthandSymbol: string
): string {
  return node.value.values
    .map((value) => `${shorthandSymbol}${value}`)
    .join("");
}

function printText(node: TextNode) {
  return node.text.join(" ");
}

function attributeQuotesNeeded(values: string[]) {
  return values.length > 1 || values.some((value) => value.match(/[,\[\]=]/));
}

export const parsers = { [PLUGIN_KEY]: parser };
export const printers = { [PLUGIN_KEY]: printer };
export const options: {
  [K in keyof AdocParserOptions]: SupportOption;
} = {
  adocLiteralParagraphSpaces: {
    category: "AsciiDoc",
    description:
      "How many spaces should be used to indent a literal paragraph?",
    type: "int",
    default: 2,
    since: "0.0.0",
  },
  adocVerbose: {
    category: "AsciiDoc",
    description: "Log details about lexing, parsing and printing.",
    type: "boolean",
    default: false,
    since: "0.0.0",
  },
  adocAlwaysQuoteAttributeValues: {
    category: "AsciiDoc",
    description:
      'If set to true will always quote attributes in assignments. E.g. [key="value"] vs [key=value]',
    type: "boolean",
    default: false,
    since: "0.0.0",
  },
  adocIdFormat: {
    category: "AsciiDoc",
    description:
      "Whether ids should be formatted in shorthand [#myid] or in formal [id=myid] syntax.",
    type: "choice",
    choices: [
      { since: "0.0.0", value: "shorthand", description: "[#myid]" },
      {
        since: "0.0.0",
        value: "formal",
        description: "[id=myid]",
      },
    ],
    default: "shorthand",
    since: "0.0.0",
  },
  adocOptionFormat: {
    category: "AsciiDoc",
    description: `Whether options should be formatted in shorthand [%option1%option2] or in formal [option=option1 option2"] syntax.`,
    type: "choice",
    choices: [
      { since: "0.0.0", value: "shorthand", description: `[%option1%option2]` },
      {
        since: "0.0.0",
        value: "formal",
        description: `[option="option1 option2"]`,
      },
    ],
    default: "shorthand",
    since: "0.0.0",
  },
  adocRoleFormat: {
    category: "AsciiDoc",
    description: `Whether roles should be formatted in shorthand [.role1.role2] or in formal [role="role1 role2"] syntax.`,
    type: "choice",
    choices: [
      { since: "0.0.0", value: "shorthand", description: `[%role1%role2]` },
      {
        since: "0.0.0",
        value: "formal",
        description: `[role="role1 role2"]`,
      },
    ],
    default: "shorthand",
    since: "0.0.0",
  },
};

export const languages: SupportLanguage[] = [
  {
    name: "AsciiDoc",
    parsers: [PLUGIN_KEY],
    extensions: [".adoc"],
    vscodeLanguageIds: ["adoc", "asciidoc"],
  },
];
