import React from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";

export function SQLEditor({
  value,
  setValue,
  onShiftEnter,
}: {
  value: string;
  setValue: (value: string) => void;
  onShiftEnter: (value: string) => void;
}) {
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);
  const onChange = React.useCallback(
    (value: string) => {
      setValue(value);
    },
    []
  );
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && event.shiftKey) {
      const editor = editorRef.current?.view;
      let queryString = value;
      if (editor) {
        const selection = editor.state.selection.main;
        const selectedText = editor.state.doc.sliceString(selection.from, selection.to);
        if (selectedText.length) {
          queryString = selectedText;
        }
      }
      onShiftEnter(queryString);
      event.preventDefault();
    }
  }
  return (
    <CodeMirror
      ref={editorRef}
      basicSetup={{
        highlightActiveLine: false,
      }}
      height={"100vh"}
      theme={atomone}
      value={value}
      extensions={[sql()]}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}
