import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";

export function SQLEditor({
  value,
  setValue,
  onShiftEnter,
}: {
  value: string;
  setValue: (value: string) => void;
  onShiftEnter: () => void;
}) {
  const onChange = React.useCallback(
    (value: string) => {
      setValue(value);
    },
    []
  );
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && event.shiftKey) {
      onShiftEnter();
      event.preventDefault();
    }
  }
  return (
    <CodeMirror
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
