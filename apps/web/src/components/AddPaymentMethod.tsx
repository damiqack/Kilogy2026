import { BankOutlined, CreditCardOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, Checkbox, Col, Form, Input, Modal, Row, Segmented, Select } from "antd";
import { useState } from "react";
import type { PaymentMethod } from "../data/types";
import {
  cardBrand, digits, formatCardNumber, formatExpiry, last4, validCardNumber, validCvc, validExpiry, validPostal,
} from "../lib/payments";

type NewMethod = Omit<PaymentMethod, "id" | "createdAt">;

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (m: NewMethod) => void;
  /** First method is always made the default. */
  hasMethods: boolean;
}

const check = (fn: (v: string) => string | null) => ({ validator: (_: unknown, v: string) => { const e = v ? fn(v) : null; return e ? Promise.reject(new Error(e)) : Promise.resolve(); } });

/**
 * "Add payment method" dialog: a card, or a Canadian bank account for pre-authorized debit.
 * Only the brand, last 4 digits and expiry are kept. The full number and security code are
 * checked and then discarded; production swaps these fields for the payment processor's.
 */
export function AddPaymentMethod({ open, onClose, onAdd, hasMethods }: Props) {
  const [kind, setKind] = useState<"card" | "bank">("card");
  const [form] = Form.useForm();
  const number = Form.useWatch("number", form) ?? "";
  const brand = cardBrand(number);

  const close = () => { form.resetFields(); setKind("card"); onClose(); };

  const submit = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return; // the form shows which fields need fixing
    }
    const isDefault = !hasMethods || !!v.makeDefault;
    if (kind === "card") {
      const b = cardBrand(v.number)!;
      onAdd({ kind: "card", brand: b, last4: last4(v.number), expiry: v.expiry, holder: v.holder.trim(), nickname: v.nickname?.trim() || undefined,
        label: `${b} •••• ${last4(v.number)}`, isDefault });
    } else {
      onAdd({ kind: "bank", last4: last4(v.account), institution: v.institution, accountType: v.accountType, holder: v.holder.trim(),
        nickname: v.nickname?.trim() || undefined, label: `${v.accountType === "savings" ? "Savings" : "Chequing"} •••• ${last4(v.account)}`, isDefault });
    }
    close();
  };

  return (
    <Modal open={open} title="Add payment method" okText={kind === "card" ? "Save card" : "Save bank account"} onOk={submit} onCancel={close} destroyOnHidden width={560}>
      <Segmented block value={kind} onChange={(v) => { setKind(v as "card" | "bank"); form.resetFields(); }} style={{ marginBottom: 16 }}
        options={[{ value: "card", label: "Credit or debit card", icon: <CreditCardOutlined /> }, { value: "bank", label: "Bank account (PAD)", icon: <BankOutlined /> }]} />

      <Form form={form} layout="vertical" requiredMark={false} initialValues={{ accountType: "chequing", makeDefault: !hasMethods }}>
        {kind === "card" ? (
          <>
            <Form.Item label="Name on card" name="holder" rules={[{ required: true, message: "Enter the name on the card" }]}>
              <Input autoComplete="cc-name" />
            </Form.Item>
            <Form.Item validateFirst label="Card number" name="number" normalize={formatCardNumber} validateTrigger="onBlur"
              rules={[{ required: true, message: "Enter the card number" }, check(validCardNumber)]}
              extra={brand ? `${brand} detected` : "Visa, Mastercard or American Express"}>
              <Input inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" suffix={<CreditCardOutlined style={{ color: "#94a3b8" }} />} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item validateFirst label="Expiry" name="expiry" normalize={formatExpiry} validateTrigger="onBlur" rules={[{ required: true, message: "Enter the expiry" }, check(validExpiry)]}>
                  <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item validateFirst label="Security code" name="cvc" normalize={(v: string) => digits(v).slice(0, 4)} validateTrigger="onBlur"
                  rules={[{ required: true, message: "Enter the code" }, check((v) => validCvc(v, brand))]}>
                  <Input.Password inputMode="numeric" autoComplete="cc-csc" placeholder={brand === "Amex" ? "4 digits" : "3 digits"} visibilityToggle={false} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item validateFirst label="Billing postal code" name="postal" validateTrigger="onBlur" rules={[{ required: true, message: "Enter a postal code" }, check(validPostal)]}>
                  <Input autoComplete="postal-code" placeholder="H3A 1A1" />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <Form.Item label="Account holder" name="holder" rules={[{ required: true, message: "Enter the account holder's name" }]}>
              <Input autoComplete="name" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item validateFirst label="Institution" name="institution" normalize={(v: string) => digits(v).slice(0, 3)} validateTrigger="onBlur"
                  rules={[{ required: true, message: "Required" }, { len: 3, message: "3 digits" }]}>
                  <Input inputMode="numeric" placeholder="001" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item validateFirst label="Transit" name="transit" normalize={(v: string) => digits(v).slice(0, 5)} validateTrigger="onBlur"
                  rules={[{ required: true, message: "Required" }, { len: 5, message: "5 digits" }]}>
                  <Input inputMode="numeric" placeholder="12345" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item validateFirst label="Account number" name="account" normalize={(v: string) => digits(v).slice(0, 12)} validateTrigger="onBlur"
                  rules={[{ required: true, message: "Required" }, { min: 7, message: "7 to 12 digits" }]}>
                  <Input inputMode="numeric" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Account type" name="accountType">
              <Select options={[{ value: "chequing", label: "Business chequing" }, { value: "savings", label: "Business savings" }]} />
            </Form.Item>
            <Form.Item name="authorize" valuePropName="checked"
              rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error("You need to authorize debits to use this account"))) }]}>
              <Checkbox>I authorize Kilogy to debit this account for shipments I book, under a pre-authorized debit (PAD) agreement. I can cancel at any time.</Checkbox>
            </Form.Item>
          </>
        )}

        <Form.Item label="Nickname (optional)" name="nickname">
          <Input placeholder={kind === "card" ? "e.g. Operations card" : "e.g. Main business account"} maxLength={40} />
        </Form.Item>
        {hasMethods && (
          <Form.Item name="makeDefault" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Checkbox>Make this my default payment method</Checkbox>
          </Form.Item>
        )}
      </Form>

      <Alert type="info" showIcon icon={<LockOutlined />}
        title="Only the last 4 digits are saved."
        description="Prototype: full numbers and the security code are checked and then discarded. The live app will use the payment processor's secure form." />
    </Modal>
  );
}
