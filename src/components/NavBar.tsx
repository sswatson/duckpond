import {
  AiOutlineCloseCircle,
  AiOutlineFileAdd,
  AiOutlineFileText,
  AiOutlineHistory,
} from "react-icons/ai";
import { BsTable } from "react-icons/bs";
import { IoShareOutline } from "react-icons/io5";
import { IoIosHelpCircleOutline } from "react-icons/io";

import * as duckdb from "@duckdb/duckdb-wasm";
import { DuckDBContext } from "./DuckDBProvider";
import { useContext, useState } from "react";

function sanitizeFileName(fileName: string): string {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
  let sanitized = nameWithoutExtension.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^\d/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }
  return sanitized;
}

function knownType(fileName: string) {
  return fileName.endsWith(".csv") || fileName.endsWith(".parquet");
}

async function handleFileUpload(
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  addFile: (fileName: string) => void
): Promise<void> {
  const fileInput = document.createElement("input");
  fileInput.type = "file";

  fileInput.addEventListener("change", async (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileName = file.name;
      await db.registerFileHandle(fileName, file, 2, true);
      addFile(fileName);
      if (knownType(fileName)) {
        setTimeout(async () => {
          await conn.query(
            `CREATE TABLE ${sanitizeFileName(
              fileName
            )} AS SELECT * FROM '${fileName}'`
          );
        }, 500);
      }
    }
  });

  fileInput.click();
}

type View = "Tables" | "Files" | "History" | "Share" | "Help";

export function NavBar({
  runQuery,
  editorContents,
  setEditorContents,
}: {
  runQuery: (query: string) => void;
  editorContents: string;
  setEditorContents: (callback: (value: string) => string) => void;
}) {
  const { db, conn, history } = useContext(DuckDBContext);
  const [tables, setTables] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View | null>(null);

  const addFile = (fileName: string) =>
    setFiles((prevFiles) => [...prevFiles, fileName]);

  const handleFileUploadButtonClick = () =>
    db && conn && handleFileUpload(db, conn, addFile);

  const handleToggleView = async (view: View) => {
    if (currentView === view) {
      setCurrentView(null);
      return;
    }
    if (view === "Tables" && conn) {
      const result = await conn.query("SHOW TABLES");
      setTables(result?.getChild("name")?.toArray());
    } else if (view === "Share") {
      updateUrlForSharing(editorContents);
    }
    setCurrentView(view);
  };

  const closeView = () => setCurrentView(null);

  return (
    <>
      <nav>
        <div className="tools">
          <a href="https://duckdb.org/">
            <img width="40" src="duckdb.svg" alt="duckdb logo" />
          </a>
          <div onClick={() => handleToggleView("Tables")}>
            <BsTable size="1.25rem" />
          </div>
          <div onClick={() => handleToggleView("Files")}>
            <AiOutlineFileText size="1.5rem" />
          </div>
          <div onClick={handleFileUploadButtonClick}>
            <AiOutlineFileAdd size="1.5rem" />
          </div>
          <div onClick={() => handleToggleView("History")}>
            <AiOutlineHistory size="1.5rem" />
          </div>
          <div onClick={() => handleToggleView("Share")}>
            <IoShareOutline size="1.5rem" />
          </div>
          <div onClick={() => handleToggleView("Help")}>
            <IoIosHelpCircleOutline size="1.625rem" />
          </div>
        </div>
      </nav>
      <ViewContainer
        currentView={currentView}
        closeView={closeView}
        tables={tables}
        files={files}
        history={history}
        runQuery={runQuery}
        editorContents={editorContents}
        setEditorContents={setEditorContents}
      />
    </>
  );
}

interface ViewContainerProps {
  currentView: View | null;
  closeView: () => void;
  files: string[];
  history: string[];
  tables: string[];
  runQuery: (query: string) => void;
  editorContents: string;
  setEditorContents: (callback: (value: string) => string) => void;
}

const ViewContainer: React.FC<ViewContainerProps> = ({
  currentView,
  closeView,
  files,
  history,
  tables,
  runQuery,
  editorContents,
  setEditorContents,
}) => {
  if (!currentView) return null;

  const handleItemClick = (item: string) => {
    if (currentView === "Tables") {
      runQuery(`select * from ${item} limit 100`);
    } else if (currentView === "Files") {
      runQuery(`select * from '${item}' limit 100`);
    } else if (currentView === "History") {
      setEditorContents((value) => value + "\n\n" + item);
    }
  };

  const renderList = (list: string[]) =>
    list.length > 0 ? (
      list.map((item) => (
        <div
          key={item}
          className="list-item"
          onClick={() => handleItemClick(item)}
        >
          {item}
        </div>
      ))
    ) : (
      <div>(none)</div>
    );

  return (
    <div className="list-container">
      <div className="close-button" onClick={closeView}>
        <AiOutlineCloseCircle />
      </div>
      <h1>{currentView}</h1>
      {currentView === "Tables" && renderList(tables)}
      {currentView === "Files" && renderList(files)}
      {currentView === "History" && renderList(history)}
      {currentView === "Share" && <ShareContent editorContents={editorContents}/>}
      {currentView === "Help" && <HelpContent />}
    </div>
  );
};

function ShareContent({editorContents}: {editorContents: string}) {
  return <>
    To share your current editor contents, copy the URL from the address bar:
    <CopyUrlButton editorContents={editorContents}/>
  </>;
}

function CopyUrlButton({editorContents}: {editorContents: string}) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    updateUrlForSharing(editorContents);
    const url = new URL(window.location.href);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
  };

  return (
    <div className="copy-to-clipboard" onClick={handleClick}>
      {copied ? "Copied!" : "Copy URL"}
    </div>
  );
}

const HelpContent: React.FC = () => (
  <>
    <p>
      To run a SQL query entirely in your browser using{" "}
      <a href="https://duckdb.org">DuckDB</a>{" "}
      <a href="https://duckdb.org/2021/10/29/duckdb-wasm.html">WASM</a>, press
      Shift+Enter with your cursor in the editor pane.
      You can also highlight a portion of the text before pressing Shift+Enter to run only that portion.
    </p>
    <p>
      To view your tables, click the{" "}
      <span style={{ display: "inline-block", transform: "translateY(2px)" }}>
        <BsTable />
      </span>{" "}
      button.
    </p>
    <p>
      To view the files in the internal DuckDB file system, click the{" "}
      <span style={{ display: "inline-block", transform: "translateY(2px)" }}>
        <AiOutlineFileText />
      </span>{" "}
      button.
    </p>
    <p>
      To add a file to the internal DuckDB file system, click the{" "}
      <span style={{ display: "inline-block", transform: "translateY(2px)" }}>
        <AiOutlineFileAdd />
      </span>{" "}
      button. Files with a .parquet or .csv extension will trigger a table
      insertion upon upload.
    </p>
    <p>
      To share the contents of your editor, click the{" "} <span style={{ display: "inline-block", transform: "translateY(2px)" }}>
        <IoShareOutline />
      </span>{" "} button.
    </p>
    <p>
      For more details and tips, see the <code>duckdb-wasm</code>{" "}
      <a href="https://github.com/duckdb/duckdb-wasm/blob/master/packages/duckdb-wasm/README.md">
        README
      </a>
      .
    </p>
    <h2>Note</h2>
    <p>
      This app was created by <a href="https://github.com/sswatson">sswatson</a> and is not affiliated with the DuckDB project. See{" "}
      <a href="https://shell.duckdb.org/">DuckDB Shell</a> for an official
      application that runs DuckDB WASM.
    </p>
  </>
);

function updateUrlForSharing(editorContents: string) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('query');
  currentUrl.searchParams.set('query', encodeURIComponent(editorContents));
  window.history.replaceState(null, '', currentUrl.toString());
}