import { Flex } from "antd";
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Parent pages, e.g. [{ title: "Shipments", path: "/shipments" }] */
  crumbs?: { title: string; path: string }[];
  extra?: ReactNode;
}

/** Page title row: path trail, title, one-line subtitle and actions on the right. */
export function PageHeader({ title, subtitle, crumbs, extra }: Props) {
  return (
    <Flex className="page-head" justify="space-between" align="flex-end" gap={12} wrap>
      <div>
        {crumbs && (
          <nav className="page-trail" aria-label="Breadcrumb">
            {crumbs.map((c) => (
              <Fragment key={c.path}>
                <Link to={c.path}>{c.title}</Link>
                <span aria-hidden> / </span>
              </Fragment>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {extra && <Flex gap={8} wrap>{extra}</Flex>}
    </Flex>
  );
}
