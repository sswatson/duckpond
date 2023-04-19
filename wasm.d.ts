declare module '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm' {
  const wasmUrl: string;
  export default wasmUrl;
}

declare module '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm' {
  const wasmUrl: string;
  export default wasmUrl;
}

declare module '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js' {
  const workerUrl: string;
  export default workerUrl;
}

declare module '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js' {
  const workerUrl: string;
  export default workerUrl;
}