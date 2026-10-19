import { MenuOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Drawer, Grid, Input, Layout, Menu, theme } from "antd";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Indicator } from "../components/Indicator";
import { activeNavPath, NAV_ITEMS } from "../config/navigation";
import { useStore } from "../data/store";
import { useEngineStatus } from "../data/useEngineStatus";

const { Header, Content, Footer } = Layout;

/** Header controls render with the dark algorithm so they sit correctly on the navy bar. */
const headerTheme = {
  algorithm: theme.darkAlgorithm,
  token: { colorTextBase: "#ffffff", colorText: "#ffffff", colorBgContainer: "#22407e", colorBorder: "rgba(255,255,255,0.3)", colorTextPlaceholder: "rgba(255,255,255,0.75)" },
};

export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { alerts } = useStore();
  const engineLive = useEngineStatus();
  const active = activeNavPath(pathname);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const toItems = (group: "main" | "utility") =>
    NAV_ITEMS.filter((n) => n.group === group).map((n) => ({ key: n.path, label: n.label }));

  const search = (
    <Input.Search
      size="small"
      placeholder="Tracking #, city, carrier"
      aria-label="Search shipments"
      allowClear
      style={{ width: compact ? "100%" : 240 }}
      onSearch={(q) => navigate(`/shipments?q=${encodeURIComponent(q)}`)}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <ConfigProvider theme={headerTheme}>
        <Header className="topbar">
          <Link to="/" className="wordmark" aria-label="Kilogy home page">
            KILOGY<span>Logistics OS</span>
          </Link>

          {compact ? (
            <Button type="text" icon={<MenuOutlined />} aria-label="Open navigation" onClick={() => setDrawerOpen(true)} style={{ marginLeft: "auto" }} />
          ) : (
            <>
              <Menu
                className="topnav"
                theme="dark"
                mode="horizontal"
                selectedKeys={[active]}
                items={toItems("main")}
                onClick={({ key }) => navigate(key)}
                style={{ flex: 1, minWidth: 0 }}
              />
              {search}
              <Link to="/dashboard" className="topbar-link">Alerts <b>{alerts.length}</b></Link>
              {NAV_ITEMS.filter((n) => n.group === "utility").map((n) => (
                <Link key={n.path} to={n.path} className={`topbar-link${active === n.path ? " is-active" : ""}`}>{n.label}</Link>
              ))}
              <span className="initials" aria-label="Signed in as DA">DA</span>
            </>
          )}
        </Header>
      </ConfigProvider>

      <Drawer placement="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} size={260} title="Menu">
        <div style={{ marginBottom: 12 }}>{search}</div>
        <Menu
          mode="inline"
          selectedKeys={[active]}
          items={[...toItems("main"), { type: "divider" as const }, ...toItems("utility")]}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 0 }}
        />
      </Drawer>

      <Content style={{ padding: compact ? "12px 12px 0" : "16px 20px 0" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Outlet />
        </div>
      </Content>

      <Footer className="statusbar">
        <span>KILOGY LOGISTICS OS v0.3</span>
        <Indicator tone={engineLive ? "success" : engineLive == null ? "neutral" : "warning"}>
          Routing engine {engineLive == null ? "checking" : engineLive ? "online" : "offline (sample results)"}
        </Indicator>
      </Footer>
    </Layout>
  );
}
