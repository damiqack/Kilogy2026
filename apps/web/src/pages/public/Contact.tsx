import { CheckCircleFilled, InfoCircleOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space } from "antd";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Fill } from "../../components/Placeholder";
import { PublicFooter, PublicHeader, useScrollOnNavigate } from "../../components/PublicChrome";
import { COUNTRIES } from "../../config/reference";
import "../landing/landing.css";
import { CONTACT } from "./about-content";
import "./public.css";

// Options below follow the "Get a Quote" form in Kilogy's website content document (page 8).
const TOPICS = [
  { value: "quote", label: "Logistics quote" },
  { value: "business", label: "Business inquiry" },
  { value: "partnership", label: "Logistics partnership" },
  { value: "integration", label: "Technology integration" },
  { value: "privacy", label: "Privacy request" },
  { value: "security", label: "Security report" },
];
const ROLES = ["Importer", "Exporter", "Manufacturer", "Retailer or e-commerce business", "Freight forwarder or logistics provider", "Individual customer", "Other"];
const SHIPMENT_TYPES = ["Commercial cargo", "E-commerce shipment", "Personal shipment", "Industrial cargo", "Agricultural products", "Other"];
const MODES = ["Air freight", "Ocean freight — FCL", "Ocean freight — LCL", "Road freight", "Courier or express", "Multimodal", "Not sure — recommend an option"];
const SERVICES = ["Port-to-port", "Airport-to-airport", "Door-to-door", "Door-to-port", "Port-to-door", "Warehouse and distribution", "Customs coordination", "Other"];
const PACKAGE_TYPES = ["Cartons", "Pallets", "Crates", "Containers", "Other"];
const PRIORITIES = ["Lowest available cost", "Fastest available delivery", "Balanced cost and speed", "Most reliable option", "Lower environmental impact", "Expert recommendation"];
const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));
const countryOpts = COUNTRIES.map(([v, label]) => ({ value: v, label }));

const ACK = "I have read the KILOGY Privacy Policy and understand that my information will be used to respond to my quotation request and coordinate relevant logistics services.";
const MARKETING = "I agree to receive KILOGY product updates and marketing communications. I understand that I can unsubscribe at any time.";

function reference(topic: string) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KLG-${topic === "quote" ? "Q" : "C"}-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Contact us page at /contact, with the quotation request form from Kilogy's content document. */
export function ContactPage() {
  useScrollOnNavigate();
  const [params] = useSearchParams();
  const [form] = Form.useForm();
  const topic: string = Form.useWatch("topic", form) ?? params.get("topic") ?? "business";
  const [sent, setSent] = useState<{ ref: string; topic: string } | null>(null);
  const isQuote = topic === "quote";

  const submit = (values: Record<string, unknown>) => {
    const ref = reference(String(values.topic));
    // No backend yet: keep a copy in this browser so the demo can show what was sent.
    try {
      const prev = JSON.parse(localStorage.getItem("kilogy.inquiries") ?? "[]");
      localStorage.setItem("kilogy.inquiries", JSON.stringify([{ ref, at: new Date().toISOString(), ...values }, ...prev].slice(0, 20)));
    } catch {
      /* ignore */
    }
    setSent({ ref, topic: String(values.topic) });
    window.scrollTo(0, 0);
  };

  return (
    <div className="pub">
      <PublicHeader />
      <section className="pub-hero">
        <div className="lp-wrap">
          <span className="lp-eyebrow">Contact us</span>
          <h1>Talk to the KILOGY team</h1>
          <p>For business inquiries, logistics partnerships, technology integration opportunities or a quotation, send us the details below.</p>
        </div>
      </section>

      <div className="lp-wrap ct-grid">
        <main>
          {sent ? (
            <div className="ct-done" role="status">
              <h2><CheckCircleFilled style={{ color: "#16a34a" }} /> Thank you for contacting KILOGY.</h2>
              {sent.topic === "quote" ? (
                <>
                  <p>Your quotation request has been submitted. Our team will review the information and contact you if additional details are required.</p>
                  <p>Your request is not a confirmed booking. Pricing, availability, service conditions and delivery estimates will be communicated separately when available.</p>
                </>
              ) : (
                <p>Your message has been sent. Our team will reply to the email address you provided.</p>
              )}
              <p style={{ marginBottom: 6 }}>Reference number:</p>
              <span className="ct-ref">{sent.ref}</span>
              <Space style={{ marginTop: 20, display: "flex" }} wrap>
                <Button onClick={() => { setSent(null); form.resetFields(); }}>Send another message</Button>
                <Link to="/"><Button type="link">Back to home</Button></Link>
              </Space>
            </div>
          ) : (
            <Form form={form} layout="vertical" requiredMark="optional" className="ct-form" onFinish={submit} scrollToFirstError
              onValuesChange={(changed) => { if ("topic" in changed) form.setFields([{ name: "message", errors: [] }]); }}
              initialValues={{ topic: params.get("topic") ?? "business", weightUnit: "kg", packages: 1 }}>
              <Form.Item label="What can we help with?" name="topic" rules={[{ required: true }]}>
                <Select options={TOPICS} style={{ maxWidth: 340 }} />
              </Form.Item>

              {isQuote && (
                <Alert type="info" showIcon style={{ marginBottom: 20 }}
                  title="Submitting this form is a request for information or a quotation. It does not confirm a booking or guarantee a price, capacity or delivery date." />
              )}

              <h2>Contact information</h2>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item label="Full name" name="name" rules={[{ required: true, message: "Enter your name" }]}><Input autoComplete="name" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Company name" name="company"><Input autoComplete="organization" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Business email" name="email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]}><Input autoComplete="email" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Telephone number" name="phone" rules={[{ required: true, message: "Enter a phone number" }, { pattern: /^[+\d\s().-]{7,20}$/, message: "Enter a valid phone number" }]}><Input autoComplete="tel" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Country" name="country" rules={[{ required: true, message: "Choose your country" }]}><Select showSearch optionFilterProp="label" options={countryOpts} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Your role" name="role"><Select options={opts(ROLES)} allowClear /></Form.Item></Col>
              </Row>

              {isQuote && (
                <>
                  <h2>Shipment requirements</h2>
                  <Row gutter={16}>
                    <Col xs={24} md={8}><Form.Item label="Shipment type" name="shipmentType"><Select options={opts(SHIPMENT_TYPES)} allowClear /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Transportation mode" name="mode"><Select options={opts(MODES)} allowClear /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Service required" name="service"><Select options={opts(SERVICES)} allowClear /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Origin country" name="originCountry" rules={[{ required: true, message: "Required" }]}><Select showSearch optionFilterProp="label" options={countryOpts} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Origin city or postal code" name="originCity" rules={[{ required: true, message: "Required" }]}><Input /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Destination country" name="destCountry" rules={[{ required: true, message: "Required" }]}><Select showSearch optionFilterProp="label" options={countryOpts} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Destination city or postal code" name="destCity" rules={[{ required: true, message: "Required" }]}><Input /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Preferred shipping date" name="shipDate"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Required delivery date" name="deliverBy"><DatePicker style={{ width: "100%" }} /></Form.Item></Col>
                  </Row>

                  <h2>Cargo details</h2>
                  <Row gutter={16}>
                    <Col span={24}><Form.Item label="Commodity description" name="commodity" rules={[{ required: true, message: "Describe the goods" }]}><Input /></Form.Item></Col>
                    <Col xs={16} md={8}><Form.Item label="Total weight" name="weight" rules={[{ required: true, message: "Required" }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                    <Col xs={8} md={4}><Form.Item label="Unit" name="weightUnit"><Select options={opts(["kg", "lb", "metric tonnes"])} /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item label="Number of packages" name="packages" rules={[{ required: true, message: "Required" }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item label="Package type" name="packageType"><Select options={opts(PACKAGE_TYPES)} allowClear /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Is the cargo dangerous or regulated?" name="dangerous"><Select options={opts(["Yes", "No", "Not sure"])} allowClear /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Temperature-controlled transport required?" name="temperature"><Select options={opts(["Yes", "No"])} allowClear /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Priority" name="priority"><Select options={opts(PRIORITIES)} allowClear /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="Customs or insurance assistance required?" name="assistance"><Select options={opts(["Yes", "No", "Please advise"])} allowClear /></Form.Item></Col>
                  </Row>
                </>
              )}

              <h2>{isQuote ? "Additional information" : "Your message"}</h2>
              <Form.Item label="Message" name="message" rules={isQuote ? [] : [{ required: true, message: "Write a message" }]}
                extra={isQuote ? "Describe any special requirements, delivery constraints or additional services you need." : undefined}>
                <Input.TextArea rows={5} maxLength={2000} showCount />
              </Form.Item>
              {topic === "security" && (
                <Alert type="warning" showIcon style={{ marginBottom: 16 }}
                  title="Do not access, modify or disclose data beyond the scope of authorization when investigating a suspected vulnerability." />
              )}

              <Form.Item name="ack" valuePropName="checked" style={{ marginBottom: 6 }}
                rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error("Please confirm you have read the Privacy Policy"))) }]}>
                <Checkbox>{ACK} <Link to="/legal#privacy" target="_blank">Read the Privacy Policy</Link></Checkbox>
              </Form.Item>
              <Form.Item name="marketing" valuePropName="checked">
                <Checkbox>{MARKETING}</Checkbox>
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit">{isQuote ? "Request My Quote" : "Send message"}</Button>
            </Form>
          )}
        </main>

        <aside className="ct-aside">
          <div className="ct-box">
            <h3><MailOutlined /> Reach us directly</h3>
            <dl>
              <dt>Business inquiries</dt><dd><Fill text={CONTACT.businessEmail} /></dd>
              <dt>Privacy questions</dt><dd><Fill text={CONTACT.privacyEmail} /></dd>
              <dt>Security reports</dt><dd><Fill text={CONTACT.securityEmail} /></dd>
              <dt>Website</dt><dd><Fill text={CONTACT.website} /></dd>
            </dl>
          </div>
          <div className="ct-box">
            <h3>Need a price now?</h3>
            <p>Compare carrier options for your lane in under a minute.</p>
            <Link to="/shipments/new"><Button type="primary" block>Get an instant quote</Button></Link>
          </div>
          <p className="ktiny"><InfoCircleOutlined /> Highlighted details are still being confirmed by KILOGY.</p>
        </aside>
      </div>

      <PublicFooter />
    </div>
  );
}
