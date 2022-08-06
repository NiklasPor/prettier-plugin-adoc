import { tokenize } from "./lexer/tokenize";
import { cstToAst } from "./cst-to-ast";
import { AdocNode } from "./nodes";
import { parseToCST } from "./parse-to-cst";

export function parse(text: string, verbose = false): AdocNode {
  const preprocessed = "\n" + text.trim();
  const tokens = tokenize(preprocessed);
  if (verbose) {
    console.log(
      "Tokens: ",
      tokens.map((token) => token.tokenType.name + `(${token.image})`)
    );
  }

  const cst = parseToCST(tokens);
  const ast = cstToAst(cst);

  return ast;
}
