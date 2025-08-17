import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wrench, Calendar, User, Coffee, Info, CheckCircle, ListChecks, Package, X, DollarSign } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError';

const ServiceDetail = ({ showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [client, setClient] = useState(null);
  const [equipment, setEquipment] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        // Fetch service details
        const serviceDocRef = doc(db, "services", id);
        const serviceDocSnap = await getDoc(serviceDocRef);
        if (serviceDocSnap.exists()) {
          const serviceData = serviceDocSnap.data();
          setService({ ...serviceData, id: serviceDocSnap.id });

          // Fetch client details
          const clientDocRef = doc(db, "clients", serviceData.clientId);
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            setClient({ ...clientDocSnap.data(), id: clientDocSnap.id });
          }

          // Fetch equipment details
          const equipmentDocRef = doc(db, "equipment", serviceData.equipmentId);
          const equipmentDocSnap = await getDoc(equipmentDocRef);
          if (equipmentDocSnap.exists()) {
            setEquipment({ ...equipmentDocSnap.data(), id: equipmentDocSnap.id });
          }

        } else {
          showNotification('Servicio no encontrado.', 'error');
          navigate('/servicios'); // Redirect if service not found
        }
      } catch (error) {
        console.error("Error fetching service details: ", error);
        showNotification('Error al cargar detalles del servicio.', 'error');
        logError(error, 'ServiceDetail - fetchServiceData');
      }
    };

    fetchServiceData();
  }, [id, navigate, showNotification]);

  if (!service) {
    return (
      <motion.div
        className="p-8 text-center text-gray-600 bg-gray-50 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Cargando servicio...</h2>
      </motion.div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'En Progreso': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      className="p-4 md:p-8 bg-gray-50 min-h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        onClick={() => navigate('/servicios')}
        className="mb-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-all flex items-center gap-2 text-sm transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Servicios
      </motion.button>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <Wrench className="w-8 h-8 text-amber-600" />
          Detalles del Servicio: {service.type}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-gray-700">
          <p className="flex items-center gap-2"><Info className="w-5 h-5 text-gray-600" /> <strong>Folio:</strong> {service.folio}</p>
          <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-600" /> <strong>Fecha Inicio:</strong> {service.dateStart}</p>
          <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-600" /> <strong>Fecha Fin:</strong> {service.dateEnd || 'N/A'}</p>
          <p className="flex items-center gap-2"><User className="w-5 h-5 text-gray-600" /> <strong>Cliente:</strong> {client ? client.name : 'Desconocido'}</p>
          <p className="flex items-center gap-2"><Coffee className="w-5 h-5 text-gray-600" /> <strong>Equipo:</strong> {equipment ? `${equipment.brand} ${equipment.model} (${equipment.serial})` : 'Desconocido'}</p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-600" /> <strong>Estado:</strong>
            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusClass(service.status)}`}>
              {service.status}
            </span>
          </p>
          {service.technician && <p className="flex items-center gap-2"><User className="w-5 h-5 text-gray-600" /> <strong>Técnico Creador:</strong> {service.technician}</p>}
          {service.assignedTechnician && <p className="flex items-center gap-2"><User className="w-5 h-5 text-gray-600" /> <strong>Técnico Asignado:</strong> {service.assignedTechnician}</p>}
          {service.cost && <p className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-gray-600" /> <strong>Costo:</strong> ${service.cost}</p>}
          
          {service.checklist && Object.keys(service.checklist).length > 0 && (
            <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><ListChecks className="w-5 h-5" /> Checklist</h3>
              <ul className="space-y-1">
                {Object.entries(service.checklist).map(([item, completed], index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    {completed ? <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> : <X className="w-4 h-4 text-red-500 mr-2" />}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.partsUsed && service.partsUsed.length > 0 && (
            <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Piezas Usadas</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {service.partsUsed.map((part, index) => (
                  <li key={index}>
                    {part.quantity}x {part.description} - ${part.price.toFixed(2)} {part.included ? '(Incluido)' : '(Extra)'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Descripción del Servicio:</p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">{service.description || 'No hay descripción para este servicio.'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Comentarios para el Próximo Servicio:</p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">{service.nextServiceComments || 'No hay comentarios para el próximo servicio.'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceDetail;