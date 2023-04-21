
import { useRouter } from 'next/router';
import DuckDBComponent from '../components/DuckDBComponent';
import NavBar from '../components/NavBar';
import DuckDBProvider from '../components/DuckDBProvider';


export default function Page() {
  const router = useRouter();
  const { query } = router;
  return (
    <DuckDBProvider>
      <div className="page-container">
        <NavBar />
        <DuckDBComponent initialQuery={typeof query.query === "string" ? query.query : "SELECT * FROM generate_series(10)"}/>
      </div>
    </DuckDBProvider>
  )
}
