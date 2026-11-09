import { CheckCircleFilled, LogoutOutlined, MinusCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { App, Avatar, Button, Card, Col, Form, Input, Row, Select, Switch, Table, Tabs, Tag } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { initials, PERMISSIONS, ROLE_LABEL, useAuth, type NotificationKey, type StaffUser } from "../data/auth";
import "./profile.css";

const TIME_ZONES = ["America/Vancouver", "America/Los_Angeles", "America/Edmonton", "America/Toronto", "America/Halifax", "Europe/London", "Africa/Lagos", "Africa/Kinshasa", "Africa/Nairobi"];
const NOTIFICATIONS: { key: NotificationKey; label: string; help: string }[] = [
  { key: "exceptions", label: "Shipment exceptions", help: "A shipment is held, damaged or returned." },
  { key: "delayRisk", label: "Delay risk alerts", help: "The routing engine predicts a late delivery." },
  { key: "integrationErrors", label: "Carrier integration errors", help: "A carrier API fails or rejects requests." },
  { key: "weeklySummary", label: "Weekly summary email", help: "Volumes, spend and on-time rate every Monday." },
];
const TABS = ["details", "security", "notifications", "access"];
const fmt = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) });

/** Profile for the signed-in administrator or developer (route is wrapped in RequireAuth). */
export function ProfilePage() {
  const { user, signedInAt, history, signOut, updateProfile, changePassword, team } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [pwForm] = Form.useForm();
  if (!user) return null;
  const tab = TABS.includes(params.get("tab") ?? "") ? params.get("tab")! : "details";

  const details = (
    <Form layout="vertical" initialValues={user} onFinish={(v: Partial<StaffUser>) => { updateProfile(v); message.success("Profile saved"); }} className="kprof-form">
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item label="Full name" name="name" rules={[{ required: true, message: "Enter your name" }]}><Input autoComplete="name" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Job title" name="title"><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Work email" name="email" extra="Your email is managed by an administrator."><Input disabled /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Phone" name="phone" rules={[{ pattern: /^[+\d\s().-]{7,20}$/, message: "Enter a valid phone number" }]}><Input placeholder="+1 555 010 0000" autoComplete="tel" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Time zone" name="timeZone"><Select showSearch options={TIME_ZONES.map((z) => ({ value: z, label: z.replace("_", " ") }))} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Language" name="language"><Select options={[{ value: "en", label: "English" }, { value: "fr", label: "Français" }]} /></Form.Item></Col>
      </Row>
      <Button type="primary" htmlType="submit">Save changes</Button>
    </Form>
  );

  const security = (
    <div className="kprof-stack">
      <section>
        <h3>Change password</h3>
        <Form form={pwForm} layout="vertical" style={{ maxWidth: 420 }} onFinish={(v: { current: string; next: string }) => {
          const r = changePassword(v.current, v.next);
          if (r.ok) { message.success("Password changed"); pwForm.resetFields(); }
          else pwForm.setFields([{ name: "current", errors: [r.error] }]);
        }}>
          <Form.Item label="Current password" name="current" rules={[{ required: true, message: "Enter your current password" }]}><Input.Password autoComplete="current-password" /></Form.Item>
          <Form.Item label="New password" name="next" rules={[{ required: true, message: "Enter a new password" }, { min: 10, message: "Use at least 10 characters" }]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item label="Confirm new password" name="confirm" dependencies={["next"]} rules={[{ required: true, message: "Confirm the new password" },
            ({ getFieldValue }) => ({ validator: (_, v) => (!v || v === getFieldValue("next") ? Promise.resolve() : Promise.reject(new Error("Passwords don't match"))) })]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button htmlType="submit">Update password</Button>
        </Form>
      </section>
      <section className="kprof-row">
        <div>
          <h3><SafetyCertificateOutlined /> Two-step verification</h3>
          <p>Ask for a code from an authenticator app at each sign-in. {user.role === "admin" && "Recommended for administrators."}</p>
        </div>
        <Switch aria-label="Two-step verification" checked={user.twoFactor} onChange={(v) => { updateProfile({ twoFactor: v }); message.success(v ? "Two-step verification on" : "Two-step verification off"); }} />
      </section>
      <section>
        <h3>Recent sign-ins</h3>
        <Table size="small" pagination={false} rowKey={(r) => r.at} dataSource={history}
          columns={[
            { title: "When", dataIndex: "at", render: (v: string) => fmt(v) },
            { title: "Device", dataIndex: "device" },
            { title: "", key: "now", align: "right", render: (_, r) => (r.at === signedInAt ? <Tag color="blue">This session</Tag> : null) },
          ]} />
      </section>
    </div>
  );

  const notifications = (
    <ul className="kprof-switches">
      {NOTIFICATIONS.map((n) => (
        <li key={n.key}>
          <div><b>{n.label}</b><span>{n.help}</span></div>
          <Switch aria-label={n.label} checked={user.notifications[n.key]} onChange={(v) => updateProfile({ notifications: { ...user.notifications, [n.key]: v } })} />
        </li>
      ))}
    </ul>
  );

  const access = (
    <div className="kprof-stack">
      <section>
        <h3>{ROLE_LABEL[user.role]} permissions</h3>
        <ul className="kprof-perms">
          {PERMISSIONS.map((p) => {
            const on = p.roles.includes(user.role);
            return (
              <li key={p.label} className={on ? "" : "is-off"}>
                {on ? <CheckCircleFilled /> : <MinusCircleOutlined />}{p.label}
                <span className="sr-only">{on ? " (allowed)" : " (not included)"}</span>
              </li>
            );
          })}
        </ul>
        {user.role === "developer" && <p className="kprof-note">Need more access? Ask an administrator to change your role.</p>}
      </section>
      {user.role === "developer" && (
        <section className="kprof-row">
          <div><h3>API access</h3><p>Create sandbox keys and read the API reference for the carrier gateway.</p></div>
          <Link to="/developers"><Button>Open Developers &amp; API</Button></Link>
        </section>
      )}
      {user.role === "admin" && (
        <section>
          <div className="kprof-row" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Team</h3>
            <Button disabled title="Invites need the users API">Invite teammate</Button>
          </div>
          <Table size="small" pagination={false} rowKey="id" dataSource={team}
            columns={[
              { title: "Name", dataIndex: "name", render: (v: string, r) => <span className="kprof-person"><Avatar size={26} className={`kprof-av is-${r.role}`}>{initials(v)}</Avatar>{v}{r.id === user.id && <Tag style={{ marginLeft: 6 }}>You</Tag>}</span> },
              { title: "Email", dataIndex: "email" },
              { title: "Role", dataIndex: "role", render: (v: StaffUser["role"]) => ROLE_LABEL[v] },
            ]} />
        </section>
      )}
    </div>
  );

  return (
    <>
      <PageHeader title="Your profile" subtitle="Personal details, security and notifications for your staff account." />
      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={8} xl={7}>
          <Card className="kprof-card">
            <Avatar size={72} className={`kprof-av is-${user.role}`}>{initials(user.name)}</Avatar>
            <h2>{user.name}</h2>
            <p className="kprof-title">{user.title}</p>
            <span className={`kprof-role is-${user.role}`}>{ROLE_LABEL[user.role]}</span>
            <dl>
              <dt>Email</dt><dd>{user.email}</dd>
              <dt>Team</dt><dd>{user.team}</dd>
              <dt>Time zone</dt><dd>{user.timeZone.replace("_", " ")}</dd>
              <dt>Member since</dt><dd>{fmt(`${user.joinedAt}T12:00:00`, false)}</dd>
              {signedInAt && <><dt>Signed in</dt><dd>{fmt(signedInAt)}</dd></>}
            </dl>
            <Button block icon={<LogoutOutlined />} onClick={() => { signOut(); message.info("Signed out"); navigate("/"); }}>Sign out</Button>
          </Card>
        </Col>
        <Col xs={24} lg={16} xl={17}>
          <Card>
            <Tabs activeKey={tab} onChange={(k) => setParams(k === "details" ? {} : { tab: k }, { replace: true })}
              items={[
                { key: "details", label: "Details", children: details },
                { key: "security", label: "Security", children: security },
                { key: "notifications", label: "Notifications", children: notifications },
                { key: "access", label: "Access", children: access },
              ]} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
