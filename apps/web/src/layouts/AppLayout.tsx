import { BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Drawer, Grid, Input, Layout, Menu, Space, theme, Typography } from "antd";
import { ToneTag } from "../components/ToneTag";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { activeNavPath, NAV_ITEMS } from "../config/navigation";
import { useEngineStatus } from "../data/useEngineStatus";
import { useStore } from "../data/store";
import { brand } from "../theme/theme";

const { Header, Sider, Content, Footer } = Layout;

export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { alerts } = useStore();
  const engineLive = useEngineStatus();
  const { token } = theme.useToken();

  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => setCollapsed(!screens.xl && !!screens.md), [screens.xl, screens.md]);

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[activeNavPath(pathname)]}
      items={NAV_ITEMS.map((n) => ({ key: n.path, icon: n.icon, label: n.label }))}
      onClick={({ key }) => navigate(key)}
    />
  );

  const brandMark = (
    <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: collapsed && !isMobile ? "0 24px" : "0 20px" }}>
      <div style={{ width: 28, height: 28, borderRadius: 4, background: "#fff", color: token.colorPrimary, fontWeight: 800, display: "grid", placeItems: "center" }}>K</div>
      {(!collapsed || isMobile) && <span style={{ color: "#fff", fontWeight: 700, letterSpacing: 2 }}>KILOGY</span>}
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isMobile ? (
        <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} size={240}
          styles={{ body: { padding: 0, background: brand.navy }, header: { display: "none" } }}>
          {brandMark}
          {menu}
        </Drawer>
      ) : (
        <Sider width={220} collapsible collapsed={collapsed} trigger={null} style={{ position: "sticky", top: 0, height: "100vh", overflow: "auto" }}>
          {brandMark}
          {menu}
        </Sider>
      )}

      <Layout>
        <Header style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${token.colorBorderSecondary}`, position: "sticky", top: 0, zIndex: 10 }}>
          <Button
            type="text"
            aria-label={isMobile ? "Open navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
            icon={!isMobile && !collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed))}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tracking #, city or carrier"
            allowClear
            style={{ maxWidth: 360 }}
            aria-label="Search shipments"
            onPressEnter={(e) => navigate(`/shipments?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`)}
          />
          <Space size="middle" style={{ marginLeft: "auto" }}>
            <Badge count={alerts.length} size="small">
              <Button type="text" icon={<BellOutlined />} aria-label={`Notifications (${alerts.length})`} onClick={() => navigate("/")} />
            </Badge>
            <Avatar style={{ background: token.colorPrimary }} aria-label="Account">DA</Avatar>
          </Space>
        </Header>

        <Content style={{ padding: isMobile ? 16 : 24 }}>
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>
            <Outlet />
          </div>
        </Content>

        <Footer style={{ padding: "12px 24px", fontSize: 12 }}>
          <Space wrap>
            <Typography.Text type="secondary">Kilogy Logistics OS · prototype v0.3</Typography.Text>
            <ToneTag tone={engineLive ? "success" : "neutral"}>
              Routing engine: {engineLive == null ? "checking" : engineLive ? "connected" : "offline, showing sample results"}
            </ToneTag>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
}
