import { ReactNode, createContext, useMemo, useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvpWorkerURL from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_next from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import ehWorkerURL from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { ScaleLoader } from 'react-spinners';

interface DuckDB {
  db: null | duckdb.AsyncDuckDB;
  conn: null | duckdb.AsyncDuckDBConnection;
  history: string[];
  addToHistory: (query: string) => void;
}

export const DuckDBContext = createContext<DuckDB>({
  db: null,
  conn: null,
  history: [],
  addToHistory: () => {},
});

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvpWorkerURL,
  },
  eh: {
    mainModule: duckdb_wasm_next,
    mainWorker: ehWorkerURL,
  },
};

const DuckDBProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<null | duckdb.AsyncDuckDB>(null);
  const [conn, setConn] = useState<null | duckdb.AsyncDuckDBConnection>(null);
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = useMemo(
    () => (query: string) => {
      setHistory((history) => [...history, query]);
    },
    []
  );

  useEffect(() => {
    const initializeDuckDB = async () => {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      const dbInstance = new duckdb.AsyncDuckDB(logger, worker);

      await dbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker);
      const connInstance = await dbInstance.connect();

      setDb(dbInstance);
      setConn(connInstance);
    };

    initializeDuckDB();
  }, []);

  if (!db || !conn) {
    return <Loading />;
  }

  return (
    <DuckDBContext.Provider value={{ db, conn, history, addToHistory }}>
      {children}
    </DuckDBContext.Provider>
  );
};

function Loading() {
  return (
    <div className="loading-container">
      <ScaleLoader color={"#EEE"} />
    </div>
  );
}

export default DuckDBProvider;
