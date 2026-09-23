import { Link } from "react-router-dom";

export function NotFound() {
  return <div className="card empty">Page not found. <Link to="/">Back to dashboard</Link></div>;
}
