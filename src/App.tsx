import { DuckDBComponent } from "./components/DuckDBComponent";
import { NavBar } from "./components/NavBar";
import DuckDBProvider, { DuckDBContext } from "./components/DuckDBProvider";
import { useContext, useEffect, useState } from "react";
import { Table } from "apache-arrow";

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get("query");

  return (
    <DuckDBProvider>
      <MainPage query={query} />
    </DuckDBProvider>
  );
}

interface MainPageProps {
  query: string | null;
}

function MainPage({ query }: MainPageProps) {

  let initialQuery = "";
  if (!initialQuery && query) {
    initialQuery = decodeURIComponent(query);
  }
  if (!initialQuery) {
    initialQuery = localStorage.getItem("duckpondEditorContents") || "";
  }
  if (!initialQuery) {
    initialQuery = "SELECT * FROM generate_series(10)";
  }

  const { conn, addToHistory } = useContext(DuckDBContext);
  const [editorContents, setEditorContents] = useState(initialQuery);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | Table>(null);

  const [rowLimit, setRowLimit] = useState(getNextRowLimit(0));

  function incrementRowLimit() {
    setRowLimit(getNextRowLimit(rowLimit));
  }

  useEffect(() => {
    localStorage.setItem("duckpondEditorContents", editorContents);
  }, [editorContents])

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
    setRowLimit(getNextRowLimit(0));
  }

  return (
    <div className="page-container">
      <NavBar 
        runQuery={runQuery}
        editorContents={editorContents}
        setEditorContents={setEditorContents}
        />
      <DuckDBComponent
        editorContents={editorContents}
        setEditorContents={setEditorContents}
        error={error}
        result={result}
        runQuery={runQuery}
        rowLimit={rowLimit}
        incrementRowLimit={incrementRowLimit}
      />
    </div>
  );
}

function getNextRowLimit(value: number) {
  if (value === 0) return 100;
  if (value === 100) return 500;
  if (value === 500) return 1000;
  if (value < 10000) return value + 1000;
  return value + 10000;
}