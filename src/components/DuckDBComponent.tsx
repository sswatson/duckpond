import { useContext, useEffect, useState } from "react";
import ArrowTable from "./ArrowTable";
import { SQLEditor } from "./SQLEditor";
import { DuckDBContext } from "./DuckDBProvider";
import { Table } from "apache-arrow";
import { useResizablePanes } from "../lib/hooks/useResizablePanes";

const DuckDBComponent = ({ initialQuery }: { initialQuery: string }) => {
  const { conn, addToHistory } = useContext(DuckDBContext);
  const [value, setValue] = useState(initialQuery);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | Table>(null);
  const { containerRef, editorContainerRef, resultContainerRef, dividerRef, handleMouseDown } =
    useResizablePanes();

  async function runQuery(value: string) {
    if (!conn) return;
    try {
      const res = await conn.query(value);
      setResult(res);
      setError("");
      addToHistory(value);
    } catch (err) {
      console.error(err);
      setError(err!.toString());
      setResult(null);
    }
  }

  useEffect(() => {
    runQuery(value);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (containerRef.current && editorContainerRef.current && resultContainerRef.current && dividerRef.current) {
      const totalWidth = containerRef.current.clientWidth;
      const dividerWidth = dividerRef.current.offsetWidth;
      const availableWidth = totalWidth - dividerWidth;
      const halfWidth = Math.floor(availableWidth / 2);
  
      editorContainerRef.current.style.width = `${halfWidth}px`;
      resultContainerRef.current.style.width = `${availableWidth - halfWidth}px`;
    }
  }, [containerRef, editorContainerRef, resultContainerRef, dividerRef]);

  return (
    <div className="resizable-container" ref={containerRef} >
      <div className="editor-container" ref={editorContainerRef}>
        <SQLEditor value={value} setValue={setValue} onShiftEnter={runQuery} />
      </div>
      <div ref={dividerRef} className="divider" onMouseDown={handleMouseDown} />
      <div className="result-container" ref={resultContainerRef}>
        {error ? (
          <div className="error">{error}</div>
        ) : result ? (
          <ArrowTable table={result} />
        ) : null}
      </div>
    </div>
  );
};

export default DuckDBComponent;