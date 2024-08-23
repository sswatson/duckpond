import { useContext, useEffect } from "react";
import ArrowTable from "./ArrowTable";
import { SQLEditor } from "./SQLEditor";
import { DuckDBContext } from "./DuckDBProvider";
import { useResizablePanes } from "../lib/hooks/useResizablePanes";
import { Table } from "apache-arrow";

export function DuckDBComponent({
  editorContents,
  setEditorContents,
  error,
  result,
  runQuery,
  rowLimit,
  incrementRowLimit,
}: {
  editorContents: string;
  setEditorContents: (value: string) => void;
  error: string;
  result: null | Table;
  runQuery: (value: string) => void;
  rowLimit: number;
  incrementRowLimit: () => void;
}) {
  const { conn } = useContext(DuckDBContext);

  const { containerRef, editorContainerRef, handleMouseDown } =
    useResizablePanes();

  useEffect(() => {
    runQuery(editorContents);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (containerRef.current && editorContainerRef.current) {
      const totalWidth = containerRef.current.clientWidth;
      const availableWidth = totalWidth - 3; // 3px for the divider
      const halfWidth = Math.floor(availableWidth / 2);

      editorContainerRef.current.style.width = `${halfWidth}px`;
    }
  }, [containerRef, editorContainerRef]);

  return (
    <div className="resizable-container" ref={containerRef}>
      <div className="editor-container" ref={editorContainerRef}>
        <SQLEditor
          value={editorContents}
          setValue={setEditorContents}
          onShiftEnter={runQuery}
          conn={conn}
        />
      </div>
      <div className="divider" onMouseDown={handleMouseDown} />
      <div className="result-container">
        {error ? (
          <div className="error">{error}</div>
        ) : result ? (
          <ArrowTable
            table={result}
            rowLimit={rowLimit}
            incrementRowLimit={incrementRowLimit} />
        ) : null}
      </div>
    </div>
  );
};
