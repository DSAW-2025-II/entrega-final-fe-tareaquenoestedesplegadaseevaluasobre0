import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getDriverReviews, getDriverRatings } from '../api/review';
import { getPublicProfile } from '../api/user';
import ReviewList from '../components/reviews/ReviewList';
import Navbar from '../components/common/Navbar';
import { getImageUrl } from '../utils/imageUrl';
import Loading from '../components/common/Loading';
import { Star, Car, User, Calendar } from 'lucide-react';
import { formatPhone } from '../utils/phoneFormatter';

/**
 * Driver Profile Page
 * Public page to view a driver's profile, vehicle info, and reviews
 */
export default function DriverProfile() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [driverId, setDriverId] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[DriverProfile] Component mounted/updated');
    console.log('[DriverProfile] params object:', params);
    console.log('[DriverProfile] window.location.pathname:', window.location.pathname);
    
    // Try multiple ways to get driverId
    let extractedDriverId = params?.driverId;
    
    // If not in params, try to extract from URL
    if (!extractedDriverId) {
      const pathMatch = window.location.pathname.match(/\/drivers\/([a-f\d]{24})/i);
      extractedDriverId = pathMatch ? pathMatch[1] : null;
    }
    
    console.log('[DriverProfile] extractedDriverId:', extractedDriverId);
    
    if (!extractedDriverId) {
      console.error('[DriverProfile] driverId is undefined!');
      setError('ID del conductor no válido');
      setLoading(false);
      return;
    }
    
    // Store driverId in state
    setDriverId(extractedDriverId);
    
    // Load data with the extracted driverId
    loadDriverData(extractedDriverId);
  }, [params]);

  const loadDriverData = async (idToUse = null) => {
    const finalDriverId = idToUse || driverId;
    
    if (!finalDriverId) {
      console.error('[DriverProfile] Cannot load driver data: driverId is undefined');
      setError('ID del conductor no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[DriverProfile] Loading driver data for driverId:', finalDriverId);
      
      // Load driver public profile, ratings and reviews in parallel
      // The public profile endpoint includes all driver info (email, universityId, phone)
      let driverProfileData = null;
      let ratingsData = null;
      let reviewsData = { items: [], total: 0, driver: null, vehicle: null };
      
      try {
        driverProfileData = await getPublicProfile(finalDriverId);
        console.log('[DriverProfile] Driver profile loaded:', driverProfileData);
        setDriverInfo({
          firstName: driverProfileData.firstName,
          lastName: driverProfileData.lastName,
          corporateEmail: driverProfileData.corporateEmail,
          universityId: driverProfileData.universityId,
          phone: driverProfileData.phone,
          profilePhotoUrl: driverProfileData.profilePhotoUrl
        });
      } catch (profileErr) {
        console.error('[DriverProfile] Error loading driver profile:', profileErr);
        // Continue even if profile fails
      }
      
      try {
        ratingsData = await getDriverRatings(finalDriverId);
        console.log('[DriverProfile] Ratings loaded:', ratingsData);
      } catch (ratingsErr) {
        console.error('[DriverProfile] Error loading ratings:', ratingsErr);
        // Continue even if ratings fail
      }
      
      try {
        reviewsData = await getDriverReviews(finalDriverId, { page: 1, pageSize: 10 });
        console.log('[DriverProfile] Reviews loaded:', reviewsData);
        console.log('[DriverProfile] Vehicle info from reviews:', reviewsData.vehicle);
      } catch (reviewsErr) {
        console.error('[DriverProfile] Error loading reviews:', reviewsErr);
        console.error('[DriverProfile] Reviews error details:', {
          status: reviewsErr.status,
          code: reviewsErr.code,
          message: reviewsErr.message
        });
        
        // If it's a 404, the driver might not exist
        if (reviewsErr.status === 404) {
          setError('Conductor no encontrado');
          return;
        }
        
        // For other errors, continue and try fallback
        setError(`Error al cargar reseñas: ${reviewsErr.message || 'Error desconocido'}`);
      }

      setRatings(ratingsData);
      setReviews(reviewsData.items || []);
      
      // Fallback: Get driver info from reviews response if public profile failed
      if (!driverProfileData && reviewsData.driver) {
        console.log('[DriverProfile] Setting driver info from reviews response (fallback)');
        setDriverInfo({
          firstName: reviewsData.driver.firstName,
          lastName: reviewsData.driver.lastName,
          profilePhotoUrl: reviewsData.driver.profilePhotoUrl
        });
      }
      
      // Get vehicle info from reviews response (now includes vehicle info)
      if (reviewsData.vehicle) {
        console.log('[DriverProfile] Setting vehicle info from reviews response');
        setVehicleInfo({
          brand: reviewsData.vehicle.brand,
          model: reviewsData.vehicle.model,
          plate: reviewsData.vehicle.plate,
          capacity: reviewsData.vehicle.capacity,
          vehiclePhotoUrl: reviewsData.vehicle.vehiclePhotoUrl
        });
      }

      // Fallback: If driver info not in reviews response, try to get from trip search
      if (!reviewsData.driver) {
        console.log('[DriverProfile] Driver info not in reviews, trying trip search fallback');
        try {
          const { searchTrips } = await import('../api/trip');
          // Search for published trips (we'll filter for this driver)
          const tripsData = await searchTrips({ page: 1, pageSize: 50 });
          console.log('[DriverProfile] Found trips:', tripsData.items?.length || 0);
          
          const driverTrip = tripsData.items?.find(trip => {
            const tripDriverId = trip.driverId || trip.driver?.id;
            return tripDriverId === finalDriverId || 
                   (typeof tripDriverId === 'string' && tripDriverId === finalDriverId) ||
                   (tripDriverId && tripDriverId.toString() === finalDriverId);
          });
          
          if (driverTrip) {
            console.log('[DriverProfile] Found driver trip:', driverTrip);
            if (driverTrip.driver) {
              setDriverInfo({
                firstName: driverTrip.driver.firstName,
                lastName: driverTrip.driver.lastName,
                profilePhotoUrl: driverTrip.driver.profilePhotoUrl
              });
            }
            if (driverTrip.vehicle && !reviewsData.vehicle) {
              setVehicleInfo({
                brand: driverTrip.vehicle.brand,
                model: driverTrip.vehicle.model,
                plate: driverTrip.vehicle.plate,
                capacity: driverTrip.vehicle.capacity || driverTrip.totalSeats,
                vehiclePhotoUrl: driverTrip.vehicle.vehiclePhotoUrl
              });
            }
          } else {
            console.log('[DriverProfile] No trips found for this driver');
          }
        } catch (tripErr) {
          console.error('[DriverProfile] Error fetching driver info from trips:', tripErr);
        }
      }

      // If still no driver info, show placeholder
      if (!reviewsData.driver && !driverInfo) {
        console.log('[DriverProfile] No driver info found, using placeholder');
        setDriverInfo({
          firstName: 'Conductor',
          lastName: '',
          profilePhotoUrl: null
        });
      }
    } catch (err) {
      console.error('[DriverProfile] Unexpected error loading driver data:', err);
      setError(`Error al cargar el perfil del conductor: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Navbar />
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#991b1b', fontSize: '16px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'normal',
              color: 'white',
              backgroundColor: '#032567',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1A6EFF'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#032567'}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 3vw, 24px)'
      }}>
        {/* Driver Header Section */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e7e5e4',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Profile Photo and Basic Info */}
          <div className="profile-header-flex" style={{
            display: 'flex',
            alignItems: 'start',
            gap: 'clamp(16px, 3vw, 24px)',
            flexWrap: 'wrap'
          }}>
            {/* Profile Photo */}
            <div style={{
              width: 'clamp(80px, 15vw, 120px)',
              height: 'clamp(80px, 15vw, 120px)',
              borderRadius: '50%',
              backgroundColor: '#032567',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {driverInfo?.profilePhotoUrl ? (
                <img
                  src={getImageUrl(driverInfo.profilePhotoUrl)}
                  alt={`${driverInfo.firstName} ${driverInfo.lastName}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span>{getInitials(driverInfo?.firstName || 'C', driverInfo?.lastName || '')}</span>
              )}
            </div>

            {/* Driver Name and Stats */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                fontWeight: 'normal',
                color: '#1c1917',
                margin: '0 0 8px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                {driverInfo?.firstName}
              </h1>
              
              {/* Rating Display */}
              {ratings && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star className="w-5 h-5 fill-[#032567] text-[#032567]" />
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {ratings.avgRating.toFixed(1)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1rem',
                    color: '#57534e',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    ({ratings.count} {ratings.count === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              )}

              {/* Driver Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                backgroundColor: '#eff6ff',
                color: '#032567',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif'
              }}>
                <User className="w-4 h-4" />
                <span>Conductor</span>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f4',
            borderRadius: '12px',
            border: '1px solid #e7e5e4',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: '500',
              color: '#1c1917',
              margin: '0 0 16px 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              Información
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Correo
                </p>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {driverInfo?.corporateEmail || 'No disponible'}
                </p>
              </div>
              
              <div>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  ID Universitario
                </p>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {driverInfo?.universityId || 'No disponible'}
                </p>
              </div>
              
              <div>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Teléfono
                </p>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {driverInfo?.phone ? formatPhone(driverInfo.phone) : 'No disponible'}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          {vehicleInfo && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f5f5f4',
              borderRadius: '12px',
              border: '1px solid #e7e5e4'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <Car className="w-5 h-5 text-[#032567]" />
                <h2 style={{
                  fontSize: '1.3rem',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: 0,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Vehículo
                </h2>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#57534e',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Marca y Modelo
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#1c1917',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {vehicleInfo.brand} {vehicleInfo.model}
                  </p>
                </div>
                
                {vehicleInfo.plate && (
                  <div>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Placa
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {vehicleInfo.plate}
                    </p>
                  </div>
                )}
                
                {vehicleInfo.capacity && (
                  <div>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#57534e',
                      margin: '0 0 4px 0',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Capacidad
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#1c1917',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {vehicleInfo.capacity} {vehicleInfo.capacity === 1 ? 'asiento' : 'asientos'}
                    </p>
                  </div>
                )}
              </div>

              {/* Vehicle Photo */}
              {vehicleInfo.vehiclePhotoUrl && (
                <div style={{ marginTop: '16px' }}>
                  <img
                    src={getImageUrl(vehicleInfo.vehiclePhotoUrl)}
                    alt={`${vehicleInfo.brand} ${vehicleInfo.model}`}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      borderRadius: '12px',
                      border: '1px solid #e7e5e4'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* No Vehicle Message */}
          {!vehicleInfo && ratings && ratings.count > 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fffbeb',
              borderRadius: '12px',
              border: '1px solid #fde68a'
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#92400e',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                Información del vehículo no disponible
              </p>
            </div>
          )}
        </div>

        {/* Ratings Summary Card */}
        {ratings && ratings.count > 0 && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e7e5e4',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '20px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Calificaciones
            </h2>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f5f5f4',
                borderRadius: '12px',
                minWidth: '120px'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '600',
                  color: '#032567',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1'
                }}>
                  {ratings.avgRating.toFixed(1)}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  marginTop: '8px'
                }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`w-4 h-4 ${
                        value <= Math.round(ratings.avgRating)
                          ? 'fill-[#032567] text-[#032567]'
                          : 'fill-none text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#57534e',
                  margin: '8px 0 0 0',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {ratings.count} {ratings.count === 1 ? 'reseña' : 'reseñas'}
                </p>
              </div>

              {/* Histogram */}
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const percentage = ratings.count > 0 
                      ? (ratings.histogram[star] / ratings.count) * 100 
                      : 0;
                    return (
                      <div key={star} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{
                          fontSize: '0.9rem',
                          color: '#57534e',
                          width: '20px',
                          textAlign: 'right',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {star}
                        </span>
                        <Star className="w-4 h-4 fill-[#032567] text-[#032567]" />
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: '#e7e5e4',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div
                            style={{
                              height: '100%',
                              backgroundColor: '#032567',
                              width: `${percentage}%`,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: '0.85rem',
                          color: '#57534e',
                          width: '30px',
                          textAlign: 'left',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {ratings.histogram[star] || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'normal',
            color: '#1c1917',
            marginBottom: '24px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Reseñas
          </h2>
          {driverId && <ReviewList driverId={driverId} />}
        </div>

        {/* No Reviews Message */}
        {ratings && ratings.count === 0 && (
          <div style={{
            backgroundColor: '#f5f5f4',
            border: '1px solid #e7e5e4',
            borderRadius: '16px',
            padding: 'clamp(24px, 5vw, 48px)',
            textAlign: 'center'
          }}>
            <Star className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'normal',
              color: '#1c1917',
              marginBottom: '8px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Sin reseñas aún
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#57534e',
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              Este conductor aún no ha recibido reseñas de pasajeros.
            </p>
          </div>
        )}
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .profile-header-flex {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
