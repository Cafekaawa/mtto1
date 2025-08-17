import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Coffee, Wrench, UserRound } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError'; // Import logError

const ClientDetail = ({ showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [clientEquipment, setClientEquipment] = useState([]);
  const [clientServices, setClientServices] = useState([]);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Fetch client details
        const clientDocRef = doc(db, "clients", id);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          setClient({ ...clientDocSnap.data(), id: clientDocSnap.id });

          // Fetch equipment assigned to this client
          const equipmentQuery = query(collection(db, "equipment"), where("client", "==", id));
          const equipmentSnapshot = await getDocs(equipmentQuery);
          setClientEquipment(equipmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

          // Fetch services for this client
          const servicesQuery = query(collection(db, "services"), where("clientId", "==", id));
          const servicesSnapshot = await getDocs(servicesQuery);
          setClientServices(servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

        } else {
          showNotification('Cliente no encontrado.', 'error');
          navigate('/clientes'); // Redirect if client not found
        }
      } catch (error) {
        console.error("Error fetching client details: ", error);
        showNotification('Error al cargar detalles del cliente.', 'error');
        logError(error, 'ClientDetail - fetchClientData'); // Log the error
      }
    };

    fetchClientData();
  }, [id, navigate, showNotification]);

  if (!client) {
    return (
      <motion.div
        className="p-8 text-center text-gray-600 bg-gray-50 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Cargando cliente...</h2>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-8 bg-gray-50 min-h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        onClick={() => navigate('/clientes')}
        className="mb-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-all flex items-center gap-2 text-sm transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Clientes
      </motion.button>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-amber-600" />
          {client.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-gray-700">
          <p className="flex items-center gap-2"><UserRound className="w-5 h-5 text-gray-600" /> <strong>Contacto:</strong> {client.contact}</p>
          <p className="flex items-center gap-2"><Phone className="w-5 h-5 text-gray-600" /> <strong>Teléfono:</strong> {client.phone}</p>
          <p className="flex items-center gap-2"><Mail className="w-5 h-5 text-gray-600" /> <strong>Email:</strong> {client.email || 'N/A'}</p>
          <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-gray-600" /> <strong>Dirección:</strong> {client.address || 'N/A'}</p>
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Notas:</p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">{client.notes || 'No hay notas para este cliente.'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-200">
            <Coffee className="w-6 h-6 text-green-600" />
            Equipos ({clientEquipment.length})
          </h3>
          {clientEquipment.length === 0 ? (
            <p className="text-gray-500 py-4">No hay equipos registrados para este cliente.</p>
          ) : (
            <ul className="space-y-4">
              {clientEquipment.map(eq => (
                <motion.li
                  key={eq.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{eq.type} - {eq.brand} {eq.model}</p>
                    <p className="text-sm text-gray-600">Serie: {eq.serial}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 sm:mt-0">Último Servicio: {eq.lastService || 'N/A'}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-200">
            <Wrench className="w-6 h-6 text-purple-600" />
            Servicios Recientes ({clientServices.length})
          </h3>
          {clientServices.length === 0 ? (
            <p className="text-gray-500 py-4">No hay servicios recientes para este cliente.</p>
          ) : (
            <ul className="space-y-4">
              {clientServices.map(s => (
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
      </div>
    </motion.div>
  );
};

export default ClientDetail;