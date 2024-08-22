
import DuckDBComponent from './components/DuckDBComponent';
import NavBar from './components/NavBar';
import DuckDBProvider from './components/DuckDBProvider';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get('query');

  return (
    <DuckDBProvider>
      <div className="page-container">
        <NavBar />
        <DuckDBComponent initialQuery={query || "SELECT * FROM generate_series(10)"} />
      </div>
    </DuckDBProvider>
  );
}