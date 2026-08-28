import { createServerFn } from "@tanstack/react-start";

export interface PixPaymentResult {
  id: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
}

export const createPixPayment = createServerFn({ method: "POST" })
  .validator((data: { amount: number; customerName: string; description?: string }) => data)
  .handler(async ({ data }): Promise<PixPaymentResult> => {
    const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
    if (!token) throw new Error("Pagamento PIX indisponível: credencial não configurada.");

    const amount = Math.round(Number(data.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor inválido para pagamento PIX.");

    const nameParts = (data.customerName || "Cliente Online").trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "Online";

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: data.description || "Pedido Cia de Condimentos",
        payment_method_id: "pix",
        payer: {
          email: `cliente+${Date.now()}@ciadecondimentos.com.br`,
          first_name: firstName,
          last_name: lastName,
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("Mercado Pago error:", payload);
      throw new Error("Não foi possível gerar o PIX. Tente novamente.");
    }

    const tx = payload?.point_of_interaction?.transaction_data;
    if (!tx?.qr_code) throw new Error("PIX gerado sem código. Tente novamente.");

    return {
      id: String(payload.id),
      status: String(payload.status),
      qrCode: tx.qr_code,
      qrCodeBase64: tx.qr_code_base64 ?? "",
      ticketUrl: tx.ticket_url ?? null,
      expiresAt: payload.date_of_expiration ?? null,
    };
  });

export const getPixPaymentStatus = createServerFn({ method: "POST" })
  .validator((data: { paymentId: string }) => data)
  .handler(async ({ data }): Promise<{ status: string; statusDetail: string | null }> => {
    const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
    if (!token) throw new Error("Pagamento PIX indisponível: credencial não configurada.");

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(data.paymentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      console.error("Mercado Pago status error:", payload);
      throw new Error("Não foi possível consultar o pagamento.");
    }
    return { status: String(payload.status), statusDetail: payload.status_detail ?? null };
  });
