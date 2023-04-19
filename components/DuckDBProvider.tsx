import { ReactNode, createContext, useMemo, useState } from 'react';

import dynamic from "next/dynamic";
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm";
import duckdb_wasm_next from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm";
import mvpWorkerURL from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js";
import ehWorkerURL from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js";

interface DuckDB {
  db: null | duckdb.AsyncDuckDB,
  conn: null | duckdb.AsyncDuckDBConnection,
  history: string[],
  addToHistory: (query: string) => void,
}

export const DuckDBContext = createContext<DuckDB>({
  db: null,
  conn: null,
  history: [],
  addToHistory: () => {},
});

const DuckDBProvider = dynamic(
  {
    loader: async () => {
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

      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);

      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      const conn = await db.connect();

      return ({ children }: { children: ReactNode }) => {
        const [ history, setHistory ] = useState<string[]>([]);
        const addToHistory = useMemo(() => (query: string) => {
          setHistory((history) => [...history, query]);
        }, []);
        return (
          <DuckDBContext.Provider value={{
              db, conn, history, addToHistory,
            }}>
            { children }
          </DuckDBContext.Provider>
        );
      };
    },
  },
  { ssr: false }
);

export default DuckDBProvider;
