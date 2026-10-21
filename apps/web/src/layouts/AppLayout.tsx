import {
  BellOutlined, GlobalOutlined, MenuOutlined, QuestionCircleOutlined, SearchOutlined, StarFilled,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Drawer, Dropdown, Grid, Input, Layout, Menu } from "antd";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { KilogyLogo } from "../components/KilogyLogo";
import { activeNavPath, DEMO_USER, NAV_ITEMS } from "../config/navigation";
import { useStore } from "../data/store";

const { Header, Sider, Content } = Layout;

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");

/** App shell from Kilogy's dashboard mockup: navy sidebar, white header, grey canvas. */
export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { alerts } = useStore();

  useEffect(() => setDrawerOpen(false), [pathname]);

  const menu = (
    <Menu
      className="kside-menu"
      theme="dark"
      mode="inline"
      selectedKeys={[activeNavPath(pathname)]}
      onClick={({ key }) => navigate(key)}
      items={NAV_ITEMS.map((n) => ({
        key: n.path,
        icon: n.icon,
        label: n.comingSoon ? <>{n.label}<span className="kside-soon">Soon</span></> : n.label,
      }))}
    />
  );

  const sidebar = (
    <>
      <Link to="/" className="kside-logo" aria-label="Kilogy home page"><KilogyLogo onDark height={40} /></Link>
      {menu}
      <div className="kside-assist">
        <h3><span className="ico"><StarFilled /></span>AI Logistics Assistant</h3>
        <p>Ask anything about your shipments, rates, or logistics operations.</p>
        <Button type="primary" onClick={() => navigate("/assistant")}>Open Assistant →</Button>
      </div>
      <div className="kside-tag">One platform. Every carrier.<br />Every shipment.</div>
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {compact ? (
        <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} size={280}
          styles={{ body: { padding: 0, background: "#0b1f4d", display: "flex", flexDirection: "column" }, header: { display: "none" } }}>
          {sidebar}
        </Drawer>
      ) : (
        <Sider width={272} className="kside">{sidebar}</Sider>
      )}

      <Layout>
        <Header className="khead">
          {compact && <Button type="text" icon={<MenuOutlined />} aria-label="Open navigation" onClick={() => setDrawerOpen(true)} />}
          <Input.Search
            className="khead-search"
            prefix={<SearchOutlined />}
            placeholder="Search by shipment ID, tracking number, or customer..."
            aria-label="Search shipments"
            allowClear
            enterButton={false}
            onSearch={(q) => navigate(`/shipments?q=${encodeURIComponent(q)}`)}
          />
          <div className="khead-actions">
            <Badge count={alerts.length} size="small" offset={[-4, 4]}>
              <Button type="text" shape="circle" size="large" icon={<BellOutlined />} aria-label={`Notifications (${alerts.length})`} onClick={() => navigate("/dashboard")} />
            </Badge>
            <Button type="text" shape="circle" size="large" icon={<GlobalOutlined />} aria-label="Language and region" />
            <Button type="text" shape="circle" size="large" icon={<QuestionCircleOutlined />} aria-label="Help" onClick={() => navigate("/developers")} />
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "/settings", label: "Settings" },
                  { key: "/developers", label: "Developers & API" },
                  { type: "divider" },
                  { key: "/", label: "Sign out" },
                ],
                onClick: ({ key }) => navigate(key),
              }}
            >
              <button type="button" className="khead-user" style={{ background: "none", border: 0, borderLeft: "1px solid var(--k-line)" }} aria-label="Account menu">
                <Avatar size={40} style={{ background: "#1d4ed8", fontWeight: 600 }}>{initials(DEMO_USER.name)}</Avatar>
                {!compact && <span style={{ textAlign: "left" }}><b>{DEMO_USER.name}</b><small>{DEMO_USER.role}</small></span>}
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content className="kcontent">
          <div style={{ maxWidth: 1600, margin: "0 auto" }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
