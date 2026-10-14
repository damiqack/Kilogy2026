import { App, Button, Card, Col, Form, Input, Row, Select, Switch } from "antd";
import { PageHeader } from "../components/PageHeader";
import { useStore } from "../data/store";
import { USD_TO_CAD } from "../lib/money";

export function SettingsPage() {
  const { reset } = useStore();
  const { message, modal } = App.useApp();
  return (
    <>
      <PageHeader title="Settings" />
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Organization">
            <Form layout="vertical" initialValues={{ org: "Kilogy Demo Shipper Inc.", currency: "CAD" }} onFinish={() => message.success("Saved")}>
              <Form.Item label="Company name" name="org"><Input /></Form.Item>
              <Form.Item label="Display currency" name="currency" extra={`Prototype exchange rate: 1 USD = ${USD_TO_CAD} CAD.`}>
                <Select options={[{ value: "CAD", label: "CAD" }, { value: "USD", label: "USD (not yet supported)", disabled: true }]} />
              </Form.Item>
              <Button type="primary" htmlType="submit">Save</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Notifications">
            <Form layout="horizontal" labelCol={{ span: 14 }} labelAlign="left" initialValues={{ email: true, sms: false, webhook: true, alerts: true }}>
              <Form.Item label="Email updates" name="email" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item label="SMS alerts" name="sms" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item label="Webhook events" name="webhook" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item label="Delay and exception alerts" name="alerts" valuePropName="checked" style={{ marginBottom: 0 }}><Switch /></Form.Item>
            </Form>
          </Card>
          <Card size="small" title="Sample data" style={{ marginTop: 16 }}>
            <p style={{ marginTop: 0 }}>Bookings are stored in this browser until the backend is connected.</p>
            <Button danger onClick={() => modal.confirm({ title: "Reset sample data?", content: "This removes bookings made in this browser.", okText: "Reset", onOk: reset })}>Reset sample data</Button>
          </Card>
        </Col>
      </Row>
    </>
  );
}
