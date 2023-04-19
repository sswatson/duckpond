import {
  AiOutlineCloseCircle,
  AiOutlineFileAdd,
  AiOutlineFileText,
  AiOutlineHistory,
} from "react-icons/ai";
import { BsTable } from "react-icons/bs";
import { IoIosHelpCircleOutline } from "react-icons/io";

import * as duckdb from "@duckdb/duckdb-wasm";
import { DuckDBContext } from "./DuckDBProvider";
import { useContext, useState } from "react";

function removeExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function knownType(fileName: string) {
  if (fileName.endsWith(".csv")) {
    return true;
  }
  if (fileName.endsWith(".parquet")) {
    return true;
  }
  return false;
}

async function handleFileUpload(
  db: duckdb.AsyncDuckDB,
  conn: duckdb.AsyncDuckDBConnection,
  addFile: (fileName: string) => void
): Promise<void> {
  // Create a file input element
  const fileInput = document.createElement("input");
  fileInput.type = "file";

  // Listen for the change event when a file is selected
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
            `CREATE TABLE ${removeExtension(fileName)} AS SELECT * FROM '${fileName}'`
          );
        }, 500);
      }
    }
  });

  // Trigger the file input click event to open the file dialog
  fileInput.click();
}

const NavBar: React.FC = () => {
  const { db, conn, history } = useContext(DuckDBContext);
  const [files, setFiles] = useState<string[]>([]);
  const [list, setList] = useState<string[]>([]);
  const [listHeader, setListHeader] = useState<string>("");
  const [help, setHelp] = useState<boolean>(false);
  const addFile = (fileName: string) => {
    setFiles((files) => [...files, fileName]);
  };
  const handleFileUploadButtonClick = () => {
    if (db && conn) {
      handleFileUpload(db, conn, addFile);
    }
  };
  function toggleTables() {
    if (listHeader === "Tables") {
      setList([]);
      setListHeader("");
    } else {
      if (!conn) return;
      conn.query("SHOW TABLES").then((result) => {
        if (result) {
          const tableNames = result.getChild("name")?.toArray();
          setList(tableNames);
          setListHeader("Tables");
          setHelp(false);
        }
      });
    }
  }
  function toggleFiles() {
    if (listHeader === "Files") {
      setList([]);
      setListHeader("");
      setHelp(false);
    } else {
      setList(files);
      setListHeader("Files");
      setHelp(false);
    }
  }
  function toggleHelp() {
    setList([]);
    setListHeader("");
    setHelp((val) => !val);
  }
  function close() {
    setListHeader("");
    setHelp(false);
  }
  const closeButton = (
    <div className="close-button" onClick={close}>
      <AiOutlineCloseCircle />
    </div>
  );
  function toggleHistory() {
    if (listHeader === "History") {
      setList([]);
      setListHeader("");
    } else {
      setList(history);
      setListHeader("History");
    }
    setHelp(false);
  }
  return (
    <>
      <nav>
        <div className="tools">
          <a href="https://duckdb.org/">
            <img width="40" src="duckdb.svg" alt="duckdb logo" />
          </a>
          <div onClick={toggleTables}>
            <BsTable size="1.25rem" />
          </div>
          <div onClick={toggleFiles}>
            <AiOutlineFileText size="1.5rem" />
          </div>
          <div onClick={handleFileUploadButtonClick}>
            <AiOutlineFileAdd size="1.5rem" />
          </div>
          <div onClick={toggleHistory}>
            <AiOutlineHistory size="1.5rem"/>
          </div>
          <div onClick={toggleHelp}>
            <IoIosHelpCircleOutline size="1.625rem" />
          </div>
        </div>
      </nav>
      {listHeader ? (
        <div className="list-container">
          {closeButton}
          <h1> {listHeader} </h1>
          {list.map((fileName) => (
            <div className="list-item">{fileName}</div>
          ))}
          {list.length === 0 ? <div>(none)</div> : null}
        </div>
      ) : null}
      {help && !listHeader ? <div className="list-container">
        {closeButton}
          <h1>Help</h1>
          <p>
            To run a SQL query entirely in your browser using <a href="https://duckdb.org">DuckDB</a> <a href="https://duckdb.org/2021/10/29/duckdb-wasm.html">WASM</a>, press Shift+Enter with your cursor in the editor pane.
          </p>
          <p>
            To view your tables, click the <span style={{display: "inline-block", transform: "translateY(2px)"}}><BsTable /></span> button.
          </p>
          <p>
            To view the files in the internal DuckDB file system, click the <span style={{display: "inline-block", transform: "translateY(2px)"}}><AiOutlineFileText /></span> button.
          </p>
          <p>
            To add a file to the internal DuckDB file system, click the <span style={{display: "inline-block", transform: "translateY(2px)"}}><AiOutlineFileAdd /></span> button. Files with a .parquet or .csv extension will trigger a table insertion upon upload.
          </p>
          <p>
            For more details and tips, see the <code>duckdb-wasm</code> <a href="https://github.com/duckdb/duckdb-wasm/blob/master/packages/duckdb-wasm/README.md">README</a>.
          </p>
          <h2>Note</h2>
          <p>
            This app is not affiliated with the DuckDB project. See <a href="https://shell.duckdb.org/">DuckDB Shell</a> for an official application that runs DuckDB WASM.
          </p>
      </div> : null}
    </>
  );
};

export default NavBar;
