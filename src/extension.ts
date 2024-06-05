import * as vscode from "vscode";
import fs from "fs";
import { generateASTFromCode, generateCodeFromAST } from "./generate-ast";
import { getTypeSafeNode } from "./get-type-safe-node";
import {
  CommentBlock,
  ExportNamedDeclaration,
  FunctionDeclaration,
  Identifier,
} from "@babel/types";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "ad-hoc-doc.addDocumentation",
    (commandInfo) => {
      const filePath = commandInfo?.fsPath;
      const text = fs.readFileSync(filePath, "utf8");
      const ast = generateASTFromCode(text);
      const exportedDeclarations = ast.program.body.filter(
        (node) => node.type === "ExportNamedDeclaration"
      );

      exportedDeclarations.forEach((node) => {
        const exportNamedDeclaration = getTypeSafeNode<ExportNamedDeclaration>(
          node,
          "ExportNamedDeclaration"
        );

        if (!exportNamedDeclaration || !exportNamedDeclaration.declaration) {
          return;
        }
        const exportFunctionDeclaration = getTypeSafeNode<FunctionDeclaration>(
          exportNamedDeclaration.declaration,
          "FunctionDeclaration"
        );
        if (!exportFunctionDeclaration || !exportFunctionDeclaration.id) {
          return;
        }

        const identifier = getTypeSafeNode<Identifier>(
          exportFunctionDeclaration.id,
          "Identifier"
        );
        const name = identifier.name;
        // Only add a leading comment if one doesn't already exist
        if (!exportNamedDeclaration.leadingComments) {
          // CommentBlock is a type from @babel/types and it doesn't quite match recast :(
          type CommentableNode = ExportNamedDeclaration & {
            comments: CommentBlock[];
          };
          const commentableNode = node as CommentableNode;
          commentableNode.comments = [
            {
              type: "CommentBlock",
              value: `\n * @module A function called ${name}\n`,
              start: 0,
              leading: true,
              trailing: false,
            } as CommentBlock,
          ];
        }
      });

      const updatedCode = generateCodeFromAST(ast, {});
      fs.writeFileSync(filePath, updatedCode);
    }
  );

  context.subscriptions.push(disposable);
}
export function deactivate() {}
