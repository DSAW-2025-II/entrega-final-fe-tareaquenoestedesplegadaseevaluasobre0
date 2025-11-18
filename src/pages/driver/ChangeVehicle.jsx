// Página de cambio de vehículo: permite a los conductores actualizar los datos de su vehículo actual
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getMyVehicle, updateMyVehicle } from '../../api/vehicle';
import { getImageUrl } from '../../utils/imageUrl';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Navbar from '../../components/common/Navbar';

export default function ChangeVehicle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [soatPhoto, setSoatPhoto] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [soatPreview, setSoatPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Cargar datos del vehículo actual solo para validación (no prellenar formulario)
  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setVehicleLoading(true);
        const data = await getMyVehicle();
        setVehicle(data); // Solo guardar para validación de placa
        // No prellenar formulario - dejar en blanco
      } catch (err) {
        console.error('[ChangeVehicle] Error loading vehicle:', err);
        if (err.status === 404) {
          setError('No tienes un vehículo registrado');
        } else {
          setError('Error al cargar el vehículo: ' + (err.message || 'Error desconocido'));
        }
      } finally {
        setVehicleLoading(false);
      }
    };
    loadVehicle();
  }, []);

  // Manejar cambio de foto del vehículo
  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVehiclePhoto(file);
      const url = URL.createObjectURL(file);
      setVehiclePreview(url);
    }
  };

  // Manejar cambio de foto del SOAT
  const handleSoatPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSoatPhoto(file);
      const url = URL.createObjectURL(file);
      setSoatPreview(url);
    }
  };

  // Manejar envío del formulario de actualización de vehículo
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      // Validar que las fotos estén presentes
      if (!vehiclePhoto) {
        setError('La foto del vehículo es obligatoria');
        setLoading(false);
        return;
      }

      if (!soatPhoto) {
        setError('La foto del SOAT es obligatoria');
        setLoading(false);
        return;
      }

      const newPlate = data.licensePlate.toUpperCase();

      // Validar que la nueva placa no sea la misma que la actual
      if (vehicle && vehicle.plate && newPlate === vehicle.plate) {
        setError('La nueva placa debe ser diferente a la placa actual de tu vehículo');
        setLoading(false);
        return;
      }

      // Preparar datos de actualización (todas las fotos son obligatorias)
      const updates = {
        plate: newPlate,
        brand: data.brand,
        model: data.model,
        capacity: parseInt(data.capacity),
        vehiclePhoto: vehiclePhoto,
        soatPhoto: soatPhoto
      };

      // Actualizar vehículo (el backend validará que la placa no esté duplicada)
      await updateMyVehicle(updates);

      // Limpiar previews antes de navegar
      if (vehiclePreview) {
        URL.revokeObjectURL(vehiclePreview);
        setVehiclePreview(null);
      }
      if (soatPreview) {
        URL.revokeObjectURL(soatPreview);
        setSoatPreview(null);
      }
      setVehiclePhoto(null);
      setSoatPhoto(null);

      // Redirigir a detalles del vehículo después de la actualización exitosa
      // Agregar parámetro de caché para forzar recarga
      navigate(`/driver/my-vehicle?refresh=${Date.now()}`);
    } catch (err) {
      if (err.code === 'same_plate') {
        setError('La nueva placa debe ser diferente a la placa actual de tu vehículo');
      } else if (err.code === 'duplicate_license_plate' || err.code === 'duplicate_plate') {
        setError('Esta placa ya está registrada por otro conductor');
      } else if (err.code === 'invalid_file_type') {
        setError('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP');
      } else if (err.code === 'payload_too_large') {
        setError('Una o más imágenes son muy grandes. El tamaño máximo es 5MB por archivo');
      } else {
        setError(err.message || 'Error al actualizar el vehículo');
      }
    } finally {
      setLoading(false);
    }
  };

  if (vehicleLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e7e5e4',
            borderTop: '3px solid #032567',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#57534e', fontFamily: 'Inter, sans-serif' }}>Cargando vehículo...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Navbar />
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e7e5e4',
            padding: 'clamp(24px, 5vw, 48px)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              No tienes un vehículo registrado
            </h2>
            <p style={{
              color: '#57534e',
              marginBottom: '24px',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontFamily: 'Inter, sans-serif'
            }}>
              Registra tu vehículo para poder cambiarlo
            </p>
            <button
              onClick={() => navigate('/driver/register-vehicle')}
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px)',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontWeight: 'normal',
                color: 'white',
                backgroundColor: '#032567',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
            >
              Registrar vehículo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar />

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
          marginBottom: 'clamp(24px, 4vw, 32px)'
        }}>
          <button
            onClick={() => navigate('/driver/my-vehicle')}
            style={{
              background: 'none',
              border: 'none',
              color: '#032567',
              cursor: 'pointer',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 1vw, 8px)',
              padding: 'clamp(4px, 1vw, 8px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#1A6EFF';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#032567';
              e.target.style.textDecoration = 'none';
            }}
          >
            <span>←</span>
            <span>Volver</span>
          </button>
        </div>

        {/* Page Title */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          fontWeight: 'normal',
          color: '#1c1917',
          marginBottom: 'clamp(24px, 4vw, 32px)',
          fontFamily: 'Inter, sans-serif'
        }}>
          Cambiar Vehículo
        </h1>

        {/* Alert */}
        {error && (
          <div style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e7e5e4',
          padding: 'clamp(20px, 4vw, 40px)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 24px)' }}>
            <div style={{ marginBottom: 'clamp(8px, 1vw, 8px)' }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: 'clamp(8px, 1vw, 8px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Información del vehículo
              </h2>
              <p style={{
                color: '#57534e',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.5'
              }}>
                Actualiza los datos de tu vehículo. La placa debe ser única y no estar registrada por otro conductor.
              </p>
            </div>

            {/* License Plate */}
            <Input
              label="Placa *"
              placeholder="ABC123"
              error={errors.licensePlate?.message}
              {...register('licensePlate', {
                required: 'La placa es requerida',
                pattern: {
                  value: /^[A-Z]{3}\d{3}$/i,
                  message: 'Formato inválido. Ej: ABC123',
                },
              })}
            />

            {/* Brand and Model */}
            <div className="form-grid-2cols" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: 'clamp(12px, 2vw, 16px)'
            }}>
              <Input
                label="Marca *"
                placeholder="Toyota"
                error={errors.brand?.message}
                {...register('brand', {
                  required: 'La marca es requerida',
                  minLength: {
                    value: 2,
                    message: 'Mínimo 2 caracteres',
                  },
                })}
              />

              <Input
                label="Modelo *"
                placeholder="Corolla"
                error={errors.model?.message}
                {...register('model', {
                  required: 'El modelo es requerido',
                  minLength: {
                    value: 2,
                    message: 'Mínimo 2 caracteres',
                  },
                })}
              />
            </div>

            {/* Capacity */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.95rem, 2vw, 1rem)',
                fontWeight: '500',
                color: '#1c1917',
                marginBottom: 'clamp(6px, 1vw, 8px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Capacidad de pasajeros *
              </label>
              <select
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px)',
                  borderRadius: '25px',
                  border: '2px solid #e7e5e4',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: 'white',
                  color: '#1c1917',
                  outline: 'none',
                  transition: 'all 0.2s',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right clamp(10px, 2vw, 12px) center',
                  backgroundSize: '1.25em'
                }}
                {...register('capacity', {
                  required: 'La capacidad es requerida',
                })}
                onFocus={(e) => {
                  e.target.style.borderColor = '#032567';
                  e.target.style.boxShadow = '0 0 0 3px rgba(3, 37, 103, 0.1)';
                  e.target.style.backgroundColor = '#f0f9ff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e7e5e4';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = 'white';
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = '#032567';
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = '#e7e5e4';
                  }
                }}
              >
                <option value="">Selecciona</option>
                <option value="1">1 pasajero</option>
                <option value="2">2 pasajeros</option>
                <option value="3">3 pasajeros</option>
                <option value="4">4 pasajeros</option>
                <option value="5">5 pasajeros</option>
                <option value="6">6 pasajeros</option>
              </select>
              {errors.capacity && (
                <p style={{
                  marginTop: 'clamp(6px, 1vw, 8px)',
                  fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                  color: '#dc2626',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {errors.capacity.message}
                </p>
              )}
            </div>

            {/* Photos */}
            <div style={{
              borderTop: '1px solid #e7e5e4',
              paddingTop: 'clamp(20px, 3vw, 24px)',
              marginTop: 'clamp(8px, 1vw, 8px)'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
                fontWeight: 'normal',
                color: '#1c1917',
                marginBottom: 'clamp(12px, 2vw, 16px)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Fotos *
              </h3>

              <div className="vehicle-photo-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: 'clamp(16px, 3vw, 24px)'
              }}>
                {/* Vehicle Photo */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                    fontWeight: '500',
                    color: '#57534e',
                    marginBottom: 'clamp(6px, 1vw, 8px)',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Foto del vehículo *
                  </label>
                  <div style={{
                    border: '2px dashed #e7e5e4',
                    borderRadius: '12px',
                    padding: 'clamp(12px, 2vw, 16px)',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f4'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#032567';
                    e.target.style.backgroundColor = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e7e5e4';
                    e.target.style.backgroundColor = '#f5f5f4';
                  }}
                  >
                    {vehiclePreview ? (
                      <div>
                        <img 
                          src={vehiclePreview} 
                          alt="Vehicle preview" 
                          style={{
                            width: '100%',
                            height: 'clamp(150px, 25vw, 200px)',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: 'clamp(6px, 1vw, 8px)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVehiclePhoto(null);
                            setVehiclePreview(null);
                          }}
                          style={{
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            padding: 'clamp(4px, 1vw, 8px)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.textDecoration = 'underline';
                            e.target.style.color = '#991b1b';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.textDecoration = 'none';
                            e.target.style.color = '#dc2626';
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <p style={{
                          fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                          color: '#032567',
                          fontWeight: '500',
                          marginBottom: 'clamp(4px, 1vw, 4px)',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Click para subir foto
                        </p>
                        <p style={{
                          fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)',
                          color: '#57534e',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          JPEG, PNG o WebP (máx. 5MB)
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleVehiclePhotoChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* SOAT Photo */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(0.85rem, 1.5vw, 0.9rem)',
                    fontWeight: '500',
                    color: '#57534e',
                    marginBottom: 'clamp(6px, 1vw, 8px)',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Foto del SOAT *
                  </label>
                  <div style={{
                    border: '2px dashed #e7e5e4',
                    borderRadius: '12px',
                    padding: 'clamp(12px, 2vw, 16px)',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f4'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#032567';
                    e.target.style.backgroundColor = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e7e5e4';
                    e.target.style.backgroundColor = '#f5f5f4';
                  }}
                  >
                    {soatPreview ? (
                      <div>
                        <img 
                          src={soatPreview} 
                          alt="SOAT preview" 
                          style={{
                            width: '100%',
                            height: 'clamp(150px, 25vw, 200px)',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: 'clamp(6px, 1vw, 8px)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSoatPhoto(null);
                            setSoatPreview(null);
                          }}
                          style={{
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            padding: 'clamp(4px, 1vw, 8px)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.textDecoration = 'underline';
                            e.target.style.color = '#991b1b';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.textDecoration = 'none';
                            e.target.style.color = '#dc2626';
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <p style={{
                          fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                          color: '#032567',
                          fontWeight: '500',
                          marginBottom: 'clamp(4px, 1vw, 4px)',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Click para subir foto
                        </p>
                        <p style={{
                          fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)',
                          color: '#57534e',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          JPEG, PNG o WebP (máx. 5MB)
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleSoatPhotoChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="form-actions-flex" style={{
              display: 'flex',
              gap: 'clamp(8px, 2vw, 12px)',
              paddingTop: 'clamp(12px, 2vw, 16px)',
              flexWrap: 'wrap'
            }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/driver/my-vehicle')}
                disabled={loading}
                style={{ flex: '1 1 auto', minWidth: 'clamp(120px, 20vw, 140px)' }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                style={{ flex: '1 1 auto', minWidth: 'clamp(120px, 20vw, 140px)' }}
              >
                {loading ? 'Cambiando vehículo...' : 'Cambiar vehículo'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile Vertical (portrait) - max-width 480px */
        @media (max-width: 480px) {
          form {
            padding: clamp(16px, 4vw, 20px) clamp(12px, 3vw, 16px) !important;
          }
          .form-grid-2cols {
            grid-template-columns: 1fr !important;
            gap: clamp(10px, 2vw, 12px) !important;
          }
          .vehicle-photo-grid {
            grid-template-columns: 1fr !important;
            gap: clamp(12px, 2vw, 16px) !important;
          }
          .form-actions-flex {
            flex-direction: column !important;
            gap: clamp(10px, 2vw, 12px) !important;
          }
          .form-actions-flex button {
            width: 100% !important;
            min-width: 100% !important;
          }
          input, select, textarea {
            font-size: clamp(0.875rem, 2vw, 0.9rem) !important;
            padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 14px) !important;
          }
        }
        
        /* Mobile Horizontal (landscape) - 481px to 768px */
        @media (min-width: 481px) and (max-width: 768px) {
          .form-grid-2cols {
            grid-template-columns: 1fr !important;
            gap: clamp(14px, 2vw, 16px) !important;
          }
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(14px, 2vw, 20px) !important;
          }
          .form-actions-flex {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: clamp(10px, 2vw, 12px) !important;
          }
          .form-actions-flex button {
            flex: 1 1 auto !important;
            min-width: clamp(120px, 15vw, 140px) !important;
          }
        }
        
        /* Tablet Portrait - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Desktop - 1025px and above */
        @media (min-width: 1025px) {
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Orientation-specific adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .form-grid-2cols {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(10px, 1.5vw, 12px) !important;
          }
          .vehicle-photo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(12px, 2vw, 16px) !important;
          }
          .form-actions-flex {
            flex-direction: row !important;
          }
        }
      `}</style>
    </div>
  );
}
