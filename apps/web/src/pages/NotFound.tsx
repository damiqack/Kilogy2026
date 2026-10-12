import { Result } from "antd";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <Result status="404" title="Page not found" extra={<Link to="/dashboard">Back to overview</Link>} />;
}
