import { BellOutlined, MenuOutlined, MessageOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Drawer, Dropdown, Grid, Input, Layout, Menu } from "antd";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { KilogyLogo } from "../components/KilogyLogo";
import { activeNavPath, DEMO_USER, NAV_GROUPS, NAV_ITEMS, SETTINGS_ITEM } from "../config/navigation";
import { useStore } from "../data/store";

const { Header, Sider, Content } = Layout;

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");

/** App shell: navy sidebar grouped by task, white header with the page name, light canvas. */
export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { alerts } = useStore();
  const active = activeNavPath(pathname);
  const pageName = [...NAV_ITEMS, SETTINGS_ITEM].find((n) => n.path === active)?.label ?? "";

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
              <button type="button" className="khead-user" aria-label="Account menu">
                <Avatar size={34} style={{ background: "#0b1f4d", fontWeight: 600, fontSize: 13 }}>{initials(DEMO_USER.name)}</Avatar>
                {!compact && <span><b>{DEMO_USER.name.split(" ")[0]}</b><small>{DEMO_USER.role}</small></span>}
              </button>
            </Dropdown>
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
