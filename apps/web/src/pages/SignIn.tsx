import { LockOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Form, Input } from "antd";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import hero from "../assets/photos/hero-network.webp";
import { KilogyLogo } from "../components/KilogyLogo";
import { DEMO_ACCOUNTS, ROLE_LABEL, useAuth } from "../data/auth";
import "./sign-in.css";

const EMAIL_KEY = "kilogy.demo.email";
const savedEmail = () => {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
};

/**
 * Staff sign-in at /login, for Kilogy administrators and developers only.
 * Shippers don't need an account: they quote from the homepage.
 * Sign-in is checked against the prototype's demo accounts (see data/auth.tsx).
 */
export function SignInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, signIn } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/dashboard";

  if (user) return <Navigate to={next} replace />;

  async function onFinish(values: { email: string; password: string; remember?: boolean }) {
    setError(null);
    setLoading(true);
    const result = await signIn(values.email, values.password, !!values.remember);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      if (values.remember) localStorage.setItem(EMAIL_KEY, values.email);
      else localStorage.removeItem(EMAIL_KEY);
    } catch {
      /* ignore */
    }
    navigate(next, { replace: true });
  }

  return (
    <div className="si">
      <aside className="si-art" style={{ backgroundImage: `url(${hero})` }}>
        <Link to="/" aria-label="Kilogy home page"><KilogyLogo onDark height={36} /></Link>
        <div>
          <h2>Kilogy staff access</h2>
          <p>Sign in to manage carriers, shipments, API keys and the routing engine.</p>
        </div>
      </aside>

      <main className="si-main">
        <div className="si-card">
          <Link to="/" className="si-back">← Back to home</Link>
          <span className="si-eyebrow"><LockOutlined /> Administrators and developers</span>
          <h1>Sign in</h1>
          <p className="si-lead">Use your Kilogy staff account.</p>

          {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

          <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish} initialValues={{ email: savedEmail(), remember: true }}>
            <Form.Item label="Work email" name="email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]}>
              <Input size="large" placeholder="you@kilogy.com" autoComplete="username" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password" }]}>
              <Input.Password size="large" autoComplete="current-password" />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 12 }}>
              <Checkbox>Keep me signed in on this device</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>Sign in</Button>
          </Form>

          <div className="si-demo">
            <b>Prototype demo accounts</b>
            <span>Password for both: <code>kilogy-demo</code></span>
            <div className="si-demo-btns">
              {DEMO_ACCOUNTS.map((a) => (
                <Button key={a.id} size="small" onClick={() => { form.setFieldsValue({ email: a.email, password: "kilogy-demo" }); setError(null); }}>
                  Use {ROLE_LABEL[a.role].toLowerCase()} account
                </Button>
              ))}
            </div>
          </div>

          <p className="si-footer-link">Shipping with Kilogy? <Link to="/shipments/new">Get a quote without signing in</Link></p>
        </div>
      </main>
    </div>
  );
}
