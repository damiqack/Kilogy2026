import { Breadcrumb, Flex, Typography } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Parent pages, e.g. [{ title: "Shipments", path: "/shipments" }] */
  crumbs?: { title: string; path: string }[];
  extra?: ReactNode;
}

/** Standard page title row: optional breadcrumb, title, one-line subtitle and actions on the right. */
export function PageHeader({ title, subtitle, crumbs, extra }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      {crumbs && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={[...crumbs.map((c) => ({ title: <Link to={c.path}>{c.title}</Link> })), { title: typeof title === "string" ? title : "Details" }]}
        />
      )}
      <Flex justify="space-between" align="center" gap={12} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </div>
        {extra && <Flex gap={8} wrap>{extra}</Flex>}
      </Flex>
    </div>
  );
}
