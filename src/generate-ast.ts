import { File } from "@babel/types";
import { Options, parse, prettyPrint } from "recast";

export const generateASTFromCode = (code: string): File => {
  return parse(code, {
    parser: require("recast/parsers/babel-ts"),
  }) as File;
};

export const generateCodeFromAST = (ast: File, options?: Options): string =>
  prettyPrint(ast, options).code;
