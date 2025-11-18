// Endpoints de pagos: operaciones relacionadas con procesamiento de pagos (Stripe y efectivo)
import client from './client';

// Crear intento de pago con Stripe para una reserva: genera PaymentIntent para integración con Stripe
export async function createPaymentIntent(bookingId) {
  const response = await client.post(`/api/bookings/${bookingId}/payment-intent`);
  return response.data;
}

// Establecer método de pago en efectivo: pasajero elige pagar en efectivo en lugar de tarjeta
export async function setCashPayment(bookingId) {
  const response = await client.post(`/api/bookings/${bookingId}/set-cash-payment`);
  return response.data;
}

// Confirmar pago: después de que Stripe procese el pago exitosamente, confirmar en el backend
export async function confirmPayment(bookingId, paymentIntentId) {
  const response = await client.post(`/api/bookings/${bookingId}/confirm-payment`, {
    paymentIntentId
  });
  return response.data;
}

// Confirmar pago en efectivo: conductor confirma que el pasajero pagó en efectivo
export async function confirmCashPayment(bookingId) {
  const response = await client.post(`/api/bookings/${bookingId}/confirm-cash-payment`);
  return response.data;
}

// Obtener pagos pendientes: lista pagos pendientes del pasajero autenticado para viajes completados
export async function getPendingPayments() {
  const response = await client.get('/api/bookings/pending-payments');
  return response.data;
}

