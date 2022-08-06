import { tokenize } from "./parser/lexer/lexer";
import { parseToCST } from "./parser/parse-to-cst";
import { writeFileSync } from "fs";
import { CSTVisitor } from "./parser/cst-to-ast";

const example = `
= My Document
== my Subtitle
== my Subtitl2e
== my Subtit3le
== my Subti4tle
`;

const tokens = tokenize(example);
const parsed = parseToCST(tokens);

const vis = new CSTVisitor();
writeFileSync("output.json", JSON.stringify(vis.visit(parsed)));
