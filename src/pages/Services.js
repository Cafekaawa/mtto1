import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Wrench, Calendar, User, Coffee, Eye, Check, X, ListChecks, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError'; // Import logError

const Services = ({ showNotification, userRole }) => {
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const servicesCollectionRef = collection(db, "services");
  const clientsCollectionRef = collection(db, "clients");
  const equipmentCollectionRef = collection(db, "equipment");

  // Fetch services, clients, and equipment from Firestore
  useEffect(() => {
    const getServicesData = async () => {
      try {
        const servicesData = await getDocs(servicesCollectionRef);
        setServices(servicesData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));

        const clientsData = await getDocs(clientsCollectionRef);
        setClients(clientsData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));

        const equipmentData = await getDocs(equipmentCollectionRef);
        setAllEquipment(equipmentData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching services data: ", error);
        showNotification('Error al cargar servicios, clientes o equipos.', 'error');
        logError(error, 'Services - getServicesData'); // Log the error
      }
    };
    getServicesData();
  }, [showNotification]);

  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || 'N/A';
  const getEquipmentInfo = (equipmentId) => {
    const eq = allEquipment.find(e => e.id === equipmentId);
    return eq ? `${eq.brand} ${eq.model} (${eq.serial})` : 'N/A';
  };

  const filteredServices = services.filter(service =>
    service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(service.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEquipmentInfo(service.equipmentId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.folio.includes(searchTerm) // Filter by folio
  );

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      try {
        const serviceDoc = doc(db, "services", id);
        await deleteDoc(serviceDoc);
        setServices(services.filter(service => service.id !== id));
        showNotification('Servicio eliminado con éxito.', 'success');
      } catch (error) {
        console.error("Error deleting service: ", error);
        showNotification('Error al eliminar servicio.', 'error');
        logError(error, 'Services - handleDelete'); // Log the error
      }
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/servicios/${id}`);
  };

  const handleAddService = () => {
    navigate('/servicios/add');
  };

  const handleEditService = (id) => {
    navigate(`/servicios/edit/${id}`);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'En Progreso': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canAdd = userRole === 'administrador' || userRole === 'tecnico';
  const canManage = userRole === 'administrador';

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 md:gap-0">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar servicios por folio, tipo, cliente o equipo..."
            className="w-full p-3 pl-10 rounded-xl border border-gray-300 focus:ring-amber-500 focus:border-amber-500 transition-all form-input bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        {canAdd && (
          <motion.button
            onClick={handleAddService}
            className="bg-amber-600 text-white px-5 py-3 rounded-xl shadow-md hover:bg-amber-700 transition-all flex items-center gap-2 w-full md:w-auto transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Programar Servicio</span>
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200">
        {filteredServices.length === 0 ? (
          <motion.p
            className="text-center text-gray-500 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No se encontraron servicios.
          </motion.p>
        ) : (
          <div className="responsive-table-container">
            <table className="responsive-table divide-y divide-gray-200 w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Folio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha Inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Equipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredServices.map((service) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{service.folio}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-1 md:gap-2">
                        <Wrench className="w-3 h-3 md:w-4 md:h-4 text-amber-500" /> {service.type}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 flex items-center gap-1 md:gap-2">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-500" /> {service.dateStart}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                        <div className="flex items-center gap-1 md:gap-2">
                          <User className="w-3 h-3 md:w-4 md:h-4 text-gray-500" /> {getClientName(service.clientId)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Coffee className="w-3 h-3 md:w-4 md:h-4 text-gray-500" /> {getEquipmentInfo(service.equipmentId)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(service.status)}`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-1 md:space-x-2">
                          <motion.button
                            onClick={() => handleViewDetails(service.id)}
                            className="text-purple-600 hover:text-purple-900 p-1 md:p-2 rounded-full hover:bg-purple-100 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                          {canManage && (
                            <>
                              <motion.button
                                onClick={() => handleEditService(service.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 md:p-2 rounded-full hover:bg-blue-100 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4 md:w-5 md:h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDelete(service.id)}
                                className="text-red-600 hover:text-red-900 p-1 md:p-2 rounded-full hover:bg-red-100 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;