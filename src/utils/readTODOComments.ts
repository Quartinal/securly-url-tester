import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import typescript from "ts";

function readTODOCommentsBase() {
    const filePath = fileURLToPath(import.meta.url);
    const readCurrentFile = readFileSync(filePath, "utf-8");

    const sourceFile = typescript.createSourceFile(
        filePath,
        readCurrentFile,
        typescript.ScriptTarget.Latest,
        true,
    );

    const TODOComments = findTODOComments(sourceFile, readCurrentFile);

    return TODOComments;
}

interface TodoComment {
    line: number;
    column: number;
    text: string;
}

function findTODOComments(
    sourceFile: typescript.SourceFile,
    sourceText: string,
): TodoComment[] {
    const results: TodoComment[] = [];

    function visit(node: typescript.Node) {
        const leadingComments = typescript.getLeadingCommentRanges(
            sourceText,
            node.getFullStart(),
        );
        if (leadingComments) {
            leadingComments.forEach((range) => {
                const commentText = sourceText.substring(range.pos, range.end);
                if (commentText.includes("TODO")) {
                    const { line, character } = sourceFile
                        .getLineAndCharacterOfPosition(range.pos);
                    results.push({
                        line: line + 1,
                        column: character,
                        text: commentText.trim(),
                    });
                }
            });
        }

        const trailingComments = typescript.getTrailingCommentRanges(
            sourceText,
            node.getEnd(),
        );
        if (trailingComments) {
            trailingComments.forEach((range) => {
                const commentText = sourceText.substring(range.pos, range.end);
                if (commentText.includes("TODO")) {
                    const { line, character } = sourceFile
                        .getLineAndCharacterOfPosition(range.pos);
                    results.push({
                        line: line + 1,
                        column: character,
                        text: commentText.trim(),
                    });
                }
            });
        }

        typescript.forEachChild(node, visit);
    }

    visit(sourceFile);

    const lines = sourceText.split("\n");
    lines.forEach((line, index) => {
        if (
            line.includes("TODO") &&
            (line.includes("//") || line.includes("/*"))
        ) {
            const column = line.indexOf("//") >= 0
                ? line.indexOf("//")
                : line.indexOf("/*");
            const existingComment = results.find((r) => r.line === index + 1);
            if (!existingComment) {
                results.push({
                    line: index + 1,
                    column: column,
                    text: line.trim(),
                });
            }
        }
    });

    const uniqueResults = results.filter((comment, index, self) =>
        index ===
            self.findIndex((c) =>
                c.line === comment.line && c.column === comment.column
            )
    );

    return uniqueResults;
}

export default function readTODOComments() {
    return readTODOCommentsBase().filter((comment) =>
        comment.text.startsWith("//")
    );
}
