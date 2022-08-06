import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as prettier from "prettier";
import * as AdocPlugin from "./index";

const prettify = (
  code: string,
  options: AdocPlugin.PrettierAdocParserOptions
) =>
  prettier.format(code, {
    ...options,
    parser: AdocPlugin.PLUGIN_KEY,
    plugins: [AdocPlugin],
  });

const testFolder = join(__dirname, "../tests");
const tests = readdirSync(testFolder);

tests.forEach((test) =>
  it(test, () => {
    const path = join(testFolder, test);
    const input = readFileSync(join(path, "input.adoc")).toString();
    const expected = readFileSync(join(path, "expected.adoc")).toString();

    const configPath = join(path, "config.json");
    const configString =
      existsSync(configPath) && readFileSync(configPath)?.toString();
    const configObject = configString ? JSON.parse(configString) : {};

    const format = () =>
      prettify(input, { adocVerbose: true, ...configObject });

    const expectedError = expected.match(/Error\("(?<message>.*)"\)/)?.groups
      ?.message;

    if (expectedError) {
      jest.spyOn(console, "error").mockImplementation(() => {});
      expect(format).toThrow(expectedError);
    } else {
      const result = format();
      expect(result).toEqual(expected);
      // Check that a second prettifying is not changing the result again.
      expect(prettify(result, configObject)).toEqual(expected);
    }
  })
);
