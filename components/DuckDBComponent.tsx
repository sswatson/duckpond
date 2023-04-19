
import { useContext, useEffect, useState } from "react";
import ArrowTable from "./ArrowTable";
import { SQLEditor } from "./SQLEditor";
import { DuckDBContext } from "./DuckDBProvider";
import { Table } from "apache-arrow";

const DuckDBComponent = ({initialQuery}: {initialQuery: string}) => {
  const { conn, addToHistory } = useContext(DuckDBContext);
  const [value, setValue] = useState(initialQuery);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | Table>(null);
  async function runQuery() {
    if (!conn) return;
    try {
      const res = await conn.query(value);
      setResult(res);
      setError("");
      addToHistory(value);
    } catch (err) {
      console.error(err);
      setError((err as any).toString());
      setResult(null);
    }
  }
  useEffect(() => {
    runQuery();
  }, []);
  return (
    <>
      <div className="editor-container">
        <SQLEditor
          value={value}
          setValue={setValue}
          onShiftEnter={runQuery}
        />
      </div>
      <div className="result-container"
      >
        {error ? (
          <div className="error">
            { error }
          </div>
        ) : result ? (
          <ArrowTable table={result} />
        ) : null}
      </div>
    </>
  );
};

export default DuckDBComponent;
