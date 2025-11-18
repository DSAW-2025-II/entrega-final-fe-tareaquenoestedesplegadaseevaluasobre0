// Modal de pago: integración con Stripe para procesar pagos con tarjeta
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, setCashPayment, confirmPayment } from '../../api/payment';
import Toast from '../common/Toast';

// Inicializar Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function PaymentForm({ bookingId, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('[PaymentForm] Stripe state:', { stripe: !!stripe, elements: !!elements, loading });

  // Inicializar intento de pago al montar el componente
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[PaymentModal] Initializing payment for booking:', bookingId);
        const { clientSecret: secret, paymentIntentId: intentId } = await createPaymentIntent(bookingId);
        console.log('[PaymentModal] Payment intent created successfully', { paymentIntentId: intentId });
        setClientSecret(secret);
        setPaymentIntentId(intentId);
      } catch (err) {
        console.error('[PaymentModal] Error initializing payment:', err);
        const errorMessage = err.message || err.originalError?.message || 'Error al inicializar el pago';
        const errorCode = err.code || 'unknown_error';
        
        // Mostrar mensaje de error más detallado
        if (errorCode === 'network_error') {
          setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo y que la URL sea correcta.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      initializePayment();
    }
  }, [bookingId]);

  // Manejar envío del formulario de pago
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Error al procesar el pago');
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirmar pago en el backend inmediatamente
        try {
          console.log('[PaymentForm] Payment succeeded, confirming on backend...');
          await confirmPayment(bookingId, paymentIntent.id);
          console.log('[PaymentForm] Payment confirmed on backend');
          onSuccess();
        } catch (confirmError) {
          console.error('[PaymentForm] Error confirming payment:', confirmError);
          // El pago tuvo éxito en Stripe pero falló al confirmar en el backend
          // Aún así llamar onSuccess para refrescar la UI, el webhook lo manejará eventualmente
          setError('Pago procesado exitosamente, pero hubo un problema al confirmarlo. El pago se confirmará automáticamente en breve.');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1c1917',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#78716c',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e7e5e4',
          borderTop: '3px solid #032567',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Inicializando pago...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If no client secret, show error or loading
  if (!clientSecret) {
    if (error) {
      return (
        <div style={{ padding: '24px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{
              color: '#dc2626',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.95rem',
              margin: 0
            }}>
              {error}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: '#57534e',
                backgroundColor: 'transparent',
                border: '1px solid #e7e5e4',
                borderRadius: '25px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }
    // Still loading
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e7e5e4',
          borderTop: '3px solid #032567',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Inicializando pago...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'normal',
          color: '#1c1917',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '8px'
        }}>
          Pago con Tarjeta
        </h3>
        <p style={{
          fontSize: '1rem',
          color: '#57534e',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '16px'
        }}>
          Total a pagar: ${amount.toLocaleString('es-CO')} COP
        </p>
      </div>

      <div style={{
        padding: '16px',
        border: '1px solid #e7e5e4',
        borderRadius: '8px',
        marginBottom: '24px',
        backgroundColor: '#fafaf9'
      }}>
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#dc2626',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 'normal',
            color: '#57534e',
            backgroundColor: 'transparent',
            border: '1px solid #e7e5e4',
            borderRadius: '25px',
            cursor: processing ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            opacity: processing ? 0.5 : 1
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 'normal',
            color: 'white',
            backgroundColor: processing ? '#78716c' : '#032567',
            border: 'none',
            borderRadius: '25px',
            cursor: (!stripe || processing) ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {processing ? 'Procesando...' : 'Pagar'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ booking, onClose, onSuccess }) {
  // Payment method selection state - use booking's paymentMethod if already set, otherwise null
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(booking?.paymentMethod || null);

  // Update selectedPaymentMethod when booking changes
  useEffect(() => {
    if (booking?.paymentMethod) {
      setSelectedPaymentMethod(booking.paymentMethod);
    }
  }, [booking?.paymentMethod]);

  console.log('[PaymentModal] Rendering modal with booking:', booking);
  console.log('[PaymentModal] Payment method from booking:', booking?.paymentMethod);
  console.log('[PaymentModal] Selected payment method:', selectedPaymentMethod);

  if (!booking || !booking.trip) {
    console.error('[PaymentModal] Missing booking or trip data:', { booking, hasTrip: !!booking?.trip });
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '400px'
        }}>
          <p style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
            Error: No se pudo cargar la información del pago. Por favor, intenta nuevamente.
          </p>
          <button onClick={onClose} style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#032567',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = (booking.trip.pricePerSeat || 0) * (booking.seats || 1);

  const handleCashConfirm = async () => {
    try {
      // Set payment method to cash (backend will handle this)
      // The driver will confirm the payment later
      await setCashPayment(booking.id);
      onSuccess(); // Don't show success banner for cash payments
    } catch (err) {
      console.error('[PaymentModal] Error setting cash payment:', err);
      // Show error but don't close modal
    }
  };

  // If no payment method selected yet, show selection screen
  if (!selectedPaymentMethod) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px'
          }}>
            Selecciona el método de pago
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Total a pagar: <strong>${totalAmount.toLocaleString('es-CO')} COP</strong>
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('cash')}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: '#032567',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('card')}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: '#032567',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              Tarjeta
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: '#57534e',
                backgroundColor: 'transparent',
                border: '1px solid #e7e5e4',
                borderRadius: '25px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If payment method is cash, show cash confirmation directly
  const shouldShowCashConfirmation = selectedPaymentMethod === 'cash';

  if (shouldShowCashConfirmation) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px'
          }}>
            Pago en Efectivo
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#57534e',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Has seleccionado pagar en efectivo. El conductor confirmará el pago cuando recibas el dinero.
            Total a pagar: <strong>${totalAmount.toLocaleString('es-CO')} COP</strong>
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleCashConfirm}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid #e7e5e4'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            fontFamily: 'Inter, sans-serif',
            margin: 0
          }}>
            Realizar Pago
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#57534e',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Show payment method info */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '1rem',
              color: '#1c1917',
              fontFamily: 'Inter, sans-serif',
              margin: 0,
              fontWeight: '500'
            }}>
              Método de pago: <strong>{selectedPaymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}</strong>
            </p>
            {selectedPaymentMethod === 'cash' && (
              <p style={{
                fontSize: '0.9rem',
                color: '#57534e',
                fontFamily: 'Inter, sans-serif',
                margin: '8px 0 0 0'
              }}>
                El conductor confirmará el pago cuando recibas el dinero en efectivo.
              </p>
            )}
          </div>

          {selectedPaymentMethod === 'card' && (
            stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  bookingId={booking.id}
                  amount={totalAmount}
                  onSuccess={onSuccess}
                  onCancel={onClose}
                />
              </Elements>
            ) : (
              <div style={{
                padding: '24px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  color: '#92400e',
                  fontFamily: 'Inter, sans-serif',
                  marginBottom: '8px'
                }}>
                  Stripe no está configurado
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#78350f',
                  fontFamily: 'Inter, sans-serif',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5'
                }}>
                  Para procesar pagos con tarjeta, es necesario configurar la clave pública de Stripe.
                  Por favor, contacta al administrador.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={onClose}
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.95rem',
                      fontWeight: 'normal',
                      color: '#57534e',
                      backgroundColor: 'transparent',
                      border: '1px solid #e7e5e4',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          .payment-modal-content {
            padding: 20px 16px !important;
            max-width: 95vw !important;
          }
          .payment-method-selection {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .payment-method-selection button {
            width: 100% !important;
            padding: 14px 16px !important;
            font-size: 1rem !important;
          }
          .payment-actions-flex {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .payment-actions-flex button {
            width: 100% !important;
            padding: 12px 16px !important;
            font-size: 1rem !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .payment-modal-content {
            padding: 24px 20px !important;
            max-width: 90vw !important;
          }
          .payment-method-selection {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .payment-method-selection button {
            flex: 1 1 auto !important;
            min-width: 140px !important;
          }
          .payment-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .payment-actions-flex button {
            flex: 1 1 auto !important;
            min-width: 140px !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .payment-modal-content {
            padding: 16px 20px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

