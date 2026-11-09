import { BellOutlined, LoginOutlined, MenuOutlined, MessageOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { App, Avatar, Badge, Button, Drawer, Dropdown, Grid, Input, Layout, Menu } from "antd";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { KilogyLogo } from "../components/KilogyLogo";
import { activeNavPath, NAV_GROUPS, NAV_ITEMS, SETTINGS_ITEM } from "../config/navigation";
import { initials, ROLE_LABEL, useAuth } from "../data/auth";
import { useStore } from "../data/store";

const { Header, Sider, Content } = Layout;

/** App shell: navy sidebar grouped by task, white header with the page name, light canvas. */
export function AppLayout() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user, signOut } = useAuth();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { alerts } = useStore();
  const active = activeNavPath(pathname);
  const OTHER_PAGES: Record<string, string> = { "/profile": "Your profile", "/developers": "Developers & API", "/assistant": "Ask Kilogy" };
  const pageName = [...NAV_ITEMS, SETTINGS_ITEM].find((n) => n.path === active)?.label
    ?? Object.entries(OTHER_PAGES).find(([p]) => pathname.startsWith(p))?.[1] ?? "";

  useEffect(() => setDrawerOpen(false), [pathname]);

  const menuProps = {
    className: "kside-menu",
    theme: "dark" as const,
    mode: "inline" as const,
    selectedKeys: [active],
    onClick: ({ key }: { key: string }) => navigate(key),
  };

  const sidebar = (
    <>
      <Link to="/" className="kside-logo" aria-label="Kilogy home page"><KilogyLogo onDark height={34} /></Link>
      <Menu
        {...menuProps}
        items={NAV_GROUPS.map((g) => ({
          type: "group" as const,
          key: g,
          label: g,
          children: NAV_ITEMS.filter((n) => n.group === g).map((n) => ({
            key: n.path,
            icon: n.icon,
            label: n.comingSoon ? <>{n.label}<span className="kside-soon">Soon</span></> : n.label,
          })),
        }))}
      />
      <div className="kside-foot">
        <button type="button" className="kside-ask" onClick={() => navigate("/assistant")}>
          <MessageOutlined />
          <span><b>Ask Kilogy</b><small>Rates, routes and shipment questions</small></span>
        </button>
        <Menu {...menuProps} items={[{ key: SETTINGS_ITEM.path, icon: SETTINGS_ITEM.icon, label: SETTINGS_ITEM.label }]} />
      </div>
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {compact ? (
        <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} size={264}
          styles={{ body: { padding: 0, background: "#0b1f4d", display: "flex", flexDirection: "column" }, header: { display: "none" } }}>
          {sidebar}
        </Drawer>
      ) : (
        <Sider width={248} className="kside">{sidebar}</Sider>
      )}

      <Layout>
        <Header className="khead">
          {compact && <Button type="text" icon={<MenuOutlined />} aria-label="Open navigation" onClick={() => setDrawerOpen(true)} />}
          <span className="khead-page">{pageName}</span>
          <Input.Search
            className="khead-search"
            prefix={<SearchOutlined />}
            placeholder="Find a shipment or tracking number"
            aria-label="Search shipments"
            allowClear
            enterButton={false}
            onSearch={(q) => navigate(`/shipments?q=${encodeURIComponent(q)}`)}
          />
          <div className="khead-actions">
            <Badge count={alerts.length} size="small" offset={[-4, 4]}>
              <Button type="text" shape="circle" icon={<BellOutlined />} aria-label={`Notifications (${alerts.length})`} onClick={() => navigate("/tracking")} />
            </Badge>
            <Button type="text" shape="circle" icon={<QuestionCircleOutlined />} aria-label="Help" onClick={() => navigate("/developers")} />
            {user ? (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    { key: "info", type: "group", label: user.email },
                    { key: "/profile", label: "Your profile" },
                    { key: "/settings", label: "Settings" },
                    { key: "/developers", label: "Developers & API" },
                    { type: "divider" },
                    { key: "signout", label: "Sign out", danger: true },
                  ],
                  onClick: ({ key }) => {
                    if (key === "signout") { signOut(); message.info("Signed out"); navigate("/"); }
                    else navigate(key);
                  },
                }}
              >
                <button type="button" className="khead-user" aria-label={`Account menu for ${user.name}`}>
                  <Avatar size={34} style={{ background: user.role === "admin" ? "#0b1f4d" : "#0d9488", fontWeight: 600, fontSize: 13 }}>{initials(user.name)}</Avatar>
                  {!compact && <span><b>{user.name.split(" ")[0]}</b><small>{ROLE_LABEL[user.role]}</small></span>}
                </button>
              </Dropdown>
            ) : (
              <Button className="khead-signin" aria-label="Staff sign in" icon={<LoginOutlined />} onClick={() => navigate(`/login?next=${encodeURIComponent(pathname + search)}`)}>
                {compact ? "" : "Staff sign in"}
              </Button>
            )}
          </div>
        </Header>

        <Content className="kcontent">
          <div style={{ maxWidth: 1560, margin: "0 auto" }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
