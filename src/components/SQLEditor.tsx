import React, { useMemo } from "react";
import CodeMirror, { keymap, ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { acceptCompletion, autocompletion, CompletionContext, completionStatus } from "@codemirror/autocomplete";
import { indentLess, indentMore } from "@codemirror/commands";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { Table } from "apache-arrow";

export function SQLEditor({
  value,
  setValue,
  onShiftEnter,
  conn,
}: {
  value: string;
  setValue: (value: string) => void;
  onShiftEnter: (value: string) => void;
  conn: AsyncDuckDBConnection | null;
}) {
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);
  const onChange = React.useCallback(
    (value: string) => {
      setValue(value);
    },
    [setValue]
  );
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && event.shiftKey) {
      const editor = editorRef.current?.view;
      let queryString = value;
      if (editor) {
        const selection = editor.state.selection.main;
        const selectedText = editor.state.doc.sliceString(
          selection.from,
          selection.to
        );
        if (selectedText.length) {
          queryString = selectedText;
        }
      }
      onShiftEnter(queryString);
      event.preventDefault();
    }
  }
  const completions = useMemo(() => duckdbCompletions(conn), [conn]);
  return (
    <CodeMirror
      ref={editorRef}
      basicSetup={{
        highlightActiveLine: false,
      }}
      indentWithTab={false}
      height={"100vh"}
      theme={atomone}
      value={value}
      extensions={[
        sql(),
        autocompletion({ override: [completions] }),
        keymap.of([
          {
            key: 'Tab',
            preventDefault: true,
            shift: indentLess,
            run: e => {
              if (!completionStatus(e.state)) return indentMore(e);
              return acceptCompletion(e);
            },
          },
        ])
      ]}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}

function duckdbCompletions(conn: AsyncDuckDBConnection | null) {
  return async function (context: CompletionContext) {
    if (!conn) return null;
    const line = context.matchBefore(/^.*/);
    if (!line) return null;
    if (line.from == line.to && !context.explicit) {
      return null;
    }
    const arrowTable = await conn.query(
      `SELECT * FROM sql_auto_complete('${line.text}')`
    );
    const table = arrowTableToJsArray(arrowTable) as {
      suggestion: string;
      suggestion_start: number;
    }[];
    if (!table.length) {
      return null;
    }
    const shoutCase = line.text.toUpperCase() === line.text;
    const first_suggestion_start = table[0].suggestion_start;
    const wordStart = line.from + first_suggestion_start;
    const word = line.text.slice(first_suggestion_start);
    return {
      from: wordStart,
      options: table
        .filter((row) => row.suggestion_start === first_suggestion_start)
        .map((row) => ({
          label: shoutCase
            ? row.suggestion
            : matchCase(word, row.suggestion as string)
        })),
    };
  };
}

function arrowTableToJsArray(arrowTable: Table) {
  const jsArray: Record<string, unknown>[] = [];
  const columnNames = arrowTable.schema.fields.map((field) => field.name);
  const firstCol = arrowTable.getChildAt(0);
  if (!firstCol) {
    return jsArray;
  }
  const numRows = firstCol.length;
  for (let i = 0; i < numRows; i++) {
    const row: Record<string, unknown> = {};
    for (const columnName of columnNames) {
      const column = arrowTable.getChild(columnName);
      if (column) {
        row[columnName] = column.get(i);
      }
    }
    jsArray.push(row);
  }

  return jsArray;
}

function matchCase(text: string, completion: string) {
  if (!isLowerCase(completion) && !isUpperCase(completion)) {
    // if the completion is mixed case, then that means the casing
    // comes from the user originally and should be preserved:
    return completion;
  }
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (i < completion.length) {
      const completionChar = completion[i];
      if (char === char.toUpperCase()) {
        result += completionChar.toUpperCase();
      } else {
        result += completionChar.toLowerCase();
      }
    }
  }
  if (isLowerCase(text) && isUpperCase(completion)) {
    result += completion.slice(text.length).toLowerCase();
  } else {
    result += completion.slice(text.length);
  }
  return result;
}

function isLowerCase(text: string) {
  return text === text.toLowerCase();
}

function isUpperCase(text: string) {
  return text === text.toUpperCase();
}