import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Coffee, Wrench, UserRound, Settings, Calendar, FileText, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError';

const EquipmentDetail = ({ showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [client, setClient] = useState(null);
  const [equipmentServices, setEquipmentServices] = useState([]);

  useEffect(() => {
    const fetchEquipmentData = async () => {
      try {
        // Fetch equipment details
        const equipmentDocRef = doc(db, "equipment", id);
        const equipmentDocSnap = await getDoc(equipmentDocRef);
        if (equipmentDocSnap.exists()) {
          const eqData = equipmentDocSnap.data();
          setEquipment({ ...eqData, id: equipmentDocSnap.id });

          // Fetch client details if assigned
          if (eqData.client) {
            const clientDocRef = doc(db, "clients", eqData.client);
            const clientDocSnap = await getDoc(clientDocRef);
            if (clientDocSnap.exists()) {
              setClient({ ...clientDocSnap.data(), id: clientDocSnap.id });
            }
          }

          // Fetch services for this equipment
          const servicesQuery = query(collection(db, "services"), where("equipmentId", "==", id));
          const servicesSnapshot = await getDocs(servicesQuery);
          setEquipmentServices(servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

        } else {
          showNotification('Equipo no encontrado.', 'error');
          navigate('/equipos'); // Redirect if equipment not found
        }
      } catch (error) {
        console.error("Error fetching equipment details: ", error);
        showNotification('Error al cargar detalles del equipo.', 'error');
        logError(error, 'EquipmentDetail - fetchEquipmentData');
      }
    };

    fetchEquipmentData();
  }, [id, navigate, showNotification]);

  if (!equipment) {
    return (
      <motion.div
        className="p-8 text-center text-gray-600 bg-gray-50 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Cargando equipo...</h2>
      </motion.div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'asignado': return 'bg-blue-100 text-blue-800';
      case 'en servicio': return 'bg-yellow-100 text-yellow-800';
      case 'no disponible': return 'bg-red-100 text-red-800';
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
        onClick={() => navigate('/equipos')}
        className="mb-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-all flex items-center gap-2 text-sm transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Equipos
      </motion.button>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <Coffee className="w-8 h-8 text-amber-600" />
          {equipment.type} - {equipment.brand} {equipment.model}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-gray-700">
          <p className="flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> <strong>Serie:</strong> {equipment.serial}</p>
          <p className="flex items-center gap-2"><UserRound className="w-5 h-5 text-gray-600" /> <strong>Cliente:</strong> {client ? client.name : 'N/A'}</p>
          <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-600" /> <strong>Último Servicio:</strong> {equipment.lastService || 'N/A'}</p>
          {equipment.lastServiceType && <p className="flex items-center gap-2"><Wrench className="w-5 h-5 text-gray-600" /> <strong>Tipo Último Servicio:</strong> {equipment.lastServiceType}</p>}
          <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-600" /> <strong>Fecha de Compra:</strong> {equipment.purchaseDate || 'N/A'}</p>
          <p className="flex items-center gap-2"><FileText className="w-5 h-5 text-gray-600" /> <strong>Factura:</strong> {equipment.invoiceNumber || 'N/A'}</p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gray-600" /> <strong>Estado Actual:</strong> {equipment.currentStatus}
          </p>
          <p className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600" /> <strong>Status:</strong>
            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusClass(equipment.status)}`}>
              {equipment.status}
            </span>
          </p>
          {equipment.isNewInstallation && <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-600" /> <strong>Fecha de Instalación:</strong> {equipment.installationDate || 'N/A'}</p>}
          {/* Removed currentCondition field
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Condiciones Actuales:</p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">{equipment.currentCondition || 'No hay información de condiciones actuales.'}</p>
          </div>
          */}
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Notas del Equipo:</p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">{equipment.notes || 'No hay notas para este equipo.'}</p>
          </div>
        </div>
      </div>

      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-200">
          <Wrench className="w-6 h-6 text-purple-600" />
          Historial de Servicios ({equipmentServices.length})
        </h3>
        {equipmentServices.length === 0 ? (
          <p className="text-gray-500 py-4">No hay historial de servicios para este equipo.</p>
        ) : (
          <ul className="space-y-4">
            {equipmentServices.map(s => (
              <motion.li
                key={s.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <div>
                  <p className="font-semibold text-gray-900">{s.type}</p>
                  <p className="text-sm text-gray-600">Fecha: {s.dateStart}</p>
                  <p className="text-sm text-gray-600">Estado: <span className="font-medium text-blue-600">{s.status}</span></p>
                </div>
                <p className="text-sm text-gray-500 mt-2 sm:mt-0">{s.description}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EquipmentDetail;