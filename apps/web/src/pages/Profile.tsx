import {
  CameraOutlined, CheckCircleFilled, ClockCircleOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined,
  GlobalOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Card, Col, Form, Input, Row, Select, Upload } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Indicator } from "../components/Indicator";
import { PageHeader } from "../components/PageHeader";
import { recentActivity, timeAgo } from "../data/insights";
import { useStore } from "../data/store";
import { useCurrentUser, type EditableProfile } from "../data/user";
import "./profile.css";

const TIMEZONES = [
  { value: "America/Vancouver", label: "Pacific Time (Vancouver)" },
  { value: "America/Edmonton", label: "Mountain Time (Calgary)" },
  { value: "America/Toronto", label: "Eastern Time (Toronto, Montreal)" },
  { value: "America/Halifax", label: "Atlantic Time (Halifax)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Africa/Lagos", label: "West Africa (Lagos)" },
  { value: "Africa/Kinshasa", label: "Central Africa (Kinshasa)" },
  { value: "Africa/Nairobi", label: "East Africa (Nairobi)" },
  { value: "Africa/Johannesburg", label: "South Africa (Johannesburg)" },
];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];
const MAX_PHOTO_BYTES = 1024 * 1024;

const labelOf = (opts: { value: string; label: string }[], v: string) => opts.find((o) => o.value === v)?.label ?? v;
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

function Field({ label, children }: { label: string; children?: string }) {
  return (
    <div className="kprofile-field">
      <small>{label}</small>
      {children ? <span>{children}</span> : <span className="is-empty">Not set</span>}
    </div>
  );
}

function PasswordCard() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const close = () => { form.resetFields(); setOpen(false); };

  return (
    <Card size="small" title="Security">
      <div className="kprofile-sec">
        <div>
          <b><LockOutlined /> Password</b>
          <p>Use at least 12 characters. Changing it will sign you out of other devices once sign-in is connected.</p>
        </div>
        {!open && <Button onClick={() => setOpen(true)}>Change password</Button>}
      </div>
      {open && (
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16, maxWidth: 420 }}
          onFinish={() => { message.info("Password changes will work once sign-in is connected to the backend."); close(); }}>
          <Form.Item label="Current password" name="current" rules={[{ required: true, message: "Enter your current password" }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item label="New password" name="next" hasFeedback
            rules={[
              { required: true, message: "Enter a new password" },
              { min: 12, message: "Use at least 12 characters" },
              ({ getFieldValue }) => ({
                validator: (_, v) => (v && v === getFieldValue("current") ? Promise.reject(new Error("Choose a different password")) : Promise.resolve()),
              }),
            ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Confirm new password" name="confirm" dependencies={["next"]} hasFeedback
            rules={[
              { required: true, message: "Confirm the new password" },
              ({ getFieldValue }) => ({
                validator: (_, v) => (!v || getFieldValue("next") === v ? Promise.resolve() : Promise.reject(new Error("Passwords do not match"))),
              }),
            ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <div className="kprofile-actions" style={{ justifyContent: "flex-start" }}>
            <Button type="primary" htmlType="submit">Update password</Button>
            <Button onClick={close}>Cancel</Button>
          </div>
        </Form>
      )}
    </Card>
  );
}

export function ProfilePage() {
  const { message } = App.useApp();
  const { user, initials, updateUser } = useCurrentUser();
  const { shipments } = useStore();
  const [editing, setEditing] = useState(false);
  // undefined = photo unchanged; "" = removed; otherwise a data URL waiting to be saved.
  const [pendingAvatar, setPendingAvatar] = useState<string | undefined>();
  const [form] = Form.useForm<Omit<EditableProfile, "avatar">>();
  const shownAvatar = editing && pendingAvatar !== undefined ? pendingAvatar : user.avatar;

  const startEdit = () => {
    form.setFieldsValue({ name: user.name, email: user.email, phone: user.phone, title: user.title, company: user.company, timezone: user.timezone, language: user.language });
    setPendingAvatar(undefined);
    setEditing(true);
  };
  const stopEdit = () => { setEditing(false); setPendingAvatar(undefined); form.resetFields(); };
  const save = (values: Omit<EditableProfile, "avatar">) => {
    updateUser({
      name: values.name.trim(), email: values.email.trim(), phone: values.phone?.trim() ?? "",
      title: values.title?.trim() ?? "", company: values.company.trim(), timezone: values.timezone, language: values.language,
      ...(pendingAvatar !== undefined ? { avatar: pendingAvatar } : {}),
    });
    setEditing(false);
    setPendingAvatar(undefined);
    message.success("Profile saved");
  };

  const pickPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) message.error("Choose an image file (PNG, JPG or WebP).");
    else if (file.size > MAX_PHOTO_BYTES) message.error("Photo must be 1 MB or smaller.");
    else {
      try { setPendingAvatar(await readAsDataUrl(file)); } catch { message.error("Could not read that file."); }
    }
    return false; // keep antd from uploading anywhere
  };

  const activity = recentActivity(shipments, 6);

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your details, preferences and sign-in security"
        extra={!editing && <Button type="primary" icon={<EditOutlined />} onClick={startEdit}>Edit profile</Button>}
      />
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={8}>
          <Card size="small">
            <div className="kprofile-id">
              <Avatar size={96} src={shownAvatar || undefined} alt={`${user.name} profile photo`}>{initials}</Avatar>
              <h2 className="kprofile-name">{user.name}</h2>
              <div className="kprofile-meta">{[user.title, user.company].filter(Boolean).join(" · ")}</div>
              <div className="kprofile-role"><Indicator tone="info">{user.role}</Indicator></div>
              {editing && (
                <>
                  <div className="kprofile-avatar-tools">
                    <Upload accept="image/png,image/jpeg,image/webp" showUploadList={false} beforeUpload={pickPhoto}>
                      <Button icon={<CameraOutlined />}>{shownAvatar ? "Replace photo" : "Upload photo"}</Button>
                    </Upload>
                    {shownAvatar && <Button icon={<DeleteOutlined />} onClick={() => setPendingAvatar("")}>Remove</Button>}
                  </div>
                  <div className="kprofile-hint">PNG, JPG or WebP, up to 1 MB. Saved when you save the profile.</div>
                </>
              )}
            </div>
            <ul className="kprofile-facts">
              <li><MailOutlined /><span>{user.email}</span></li>
              {user.phone && <li><PhoneOutlined /><span>{user.phone}</span></li>}
              <li><EnvironmentOutlined /><span>{labelOf(TIMEZONES, user.timezone)}</span></li>
              <li><GlobalOutlined /><span>{labelOf(LANGUAGES, user.language)}</span></li>
            </ul>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card size="small" title="Personal details">
            {editing ? (
              <Form form={form} layout="vertical" requiredMark={false} onFinish={save} scrollToFirstError>
                <div className="kprofile-grid">
                  <Form.Item label="Full name" name="name" rules={[{ required: true, whitespace: true, message: "Enter your name" }, { max: 60, message: "Keep it under 60 characters" }]}>
                    <Input autoComplete="name" />
                  </Form.Item>
                  <Form.Item label="Email" name="email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]}>
                    <Input autoComplete="email" inputMode="email" />
                  </Form.Item>
                  <Form.Item label="Phone" name="phone" rules={[{ pattern: /^\+?[\d\s().-]{7,20}$/, message: "Enter a valid phone number" }]}>
                    <Input autoComplete="tel" inputMode="tel" placeholder="+1 555 555 0100" />
                  </Form.Item>
                  <Form.Item label="Job title" name="title" rules={[{ max: 60, message: "Keep it under 60 characters" }]}>
                    <Input autoComplete="organization-title" />
                  </Form.Item>
                  <Form.Item label="Company" name="company" rules={[{ required: true, whitespace: true, message: "Enter your company" }]}>
                    <Input autoComplete="organization" />
                  </Form.Item>
                  <Form.Item label="Role" extra="Set by your account admin.">
                    <Input value={user.role} disabled aria-label="Role" />
                  </Form.Item>
                  <Form.Item label="Time zone" name="timezone" rules={[{ required: true }]}>
                    <Select showSearch optionFilterProp="label" options={TIMEZONES} />
                  </Form.Item>
                  <Form.Item label="Language" name="language" extra="Menus are English for now; your choice is saved for later.">
                    <Select options={LANGUAGES} />
                  </Form.Item>
                </div>
                <div className="kprofile-actions">
                  <Button onClick={stopEdit}>Cancel</Button>
                  <Button type="primary" htmlType="submit">Save changes</Button>
                </div>
              </Form>
            ) : (
              <div className="kprofile-grid">
                <Field label="Full name">{user.name}</Field>
                <Field label="Email">{user.email}</Field>
                <Field label="Phone">{user.phone}</Field>
                <Field label="Job title">{user.title}</Field>
                <Field label="Company">{user.company}</Field>
                <Field label="Role">{user.role}</Field>
                <Field label="Time zone">{labelOf(TIMEZONES, user.timezone)}</Field>
                <Field label="Language">{labelOf(LANGUAGES, user.language)}</Field>
              </div>
            )}
          </Card>

          <div style={{ marginTop: 12 }}><PasswordCard /></div>

          <Card size="small" title="Recent activity" style={{ marginTop: 12 }}
            extra={<Link to="/shipments" style={{ fontSize: 13, fontWeight: 600 }}>All shipments</Link>}>
            {activity.length === 0 ? (
              <span className="ktiny">No activity yet. Book a shipment and it will show up here.</span>
            ) : (
              <ul className="klist">
                {activity.map(({ s, t }) => (
                  <li key={s.id + t.title + t.time}>
                    <span className="kicon-round" style={t.state === "issue" ? { background: "#fff7ed", color: "#c2410c" } : { background: "#eff6ff", color: "#1d4ed8" }} aria-hidden>
                      {t.state === "issue" ? <SafetyCertificateOutlined /> : <CheckCircleFilled />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}<span className="ktiny"> · {t.location}</span></div>
                      <Link to={`/shipments/${s.id}`} className="mono">{s.trackingId}</Link>
                    </div>
                    <time className="ktiny" style={{ whiteSpace: "nowrap" }}><ClockCircleOutlined /> {timeAgo(t.time)}</time>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
