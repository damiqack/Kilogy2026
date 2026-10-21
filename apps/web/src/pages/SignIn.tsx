import { Alert, Button, Checkbox, Form, Input, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./sign-in.css";

/**
 * Public sign-in page. Prototype: accepts any non-empty email/password
 * and routes into the dashboard. Real auth (API keys / JWT) comes later.
 */
export function SignInPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: { email: string; password: string; remember?: boolean }) {
    setError(null);
    setLoading(true);
    try {
      // Prototype: no backend auth yet — any credentials open the app.
      await new Promise((r) => setTimeout(r, 400));
      if (values.remember) {
        try {
          localStorage.setItem("kilogy.demo.email", values.email);
        } catch {
          /* ignore */
        }
      }
      navigate("/dashboard");
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="si">
      <header className="si-nav">
        <div className="si-wrap si-nav-inner">
          <Link to="/" className="si-wordmark">
            KILOGY
          </Link>
          <Link to="/" className="si-back">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="si-main">
        <div className="si-card">
          <p className="si-eyebrow">Account</p>
          <Typography.Title level={2} className="si-title">
            Sign in
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="si-lead">
            Access your dashboard, quotes, and shipments.
          </Typography.Paragraph>

          {error && (
            <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
          )}

          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={onFinish}
            initialValues={{
              email: (() => {
                try {
                  return localStorage.getItem("kilogy.demo.email") ?? "";
                } catch {
                  return "";
                }
              })(),
              remember: true,
            }}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Enter your email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input size="large" placeholder="you@company.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Enter your password" }]}
            >
              <Input.Password
                size="large"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Checkbox>Remember email</Checkbox>
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Sign in
            </Button>
          </Form>

          <p className="si-hint">
            Prototype: any email and password will open the dashboard.
          </p>

          <p className="si-footer-link">
            New here?{" "}
            <Link to="/shipments/new">Get a quote without signing in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
