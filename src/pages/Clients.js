import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError'; // Import logError

const Clients = ({ showNotification, userRole }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const clientsCollectionRef = collection(db, "clients");

  // Fetch clients from Firestore
  useEffect(() => {
    const getClients = async () => {
      try {
        const data = await getDocs(clientsCollectionRef);
        setClients(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching clients: ", error);
        showNotification('Error al cargar clientes.', 'error');
        logError(error, 'Clients - getClients'); // Log the error
      }
    };
    getClients();
  }, [showNotification]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const clientDoc = doc(db, "clients", id);
        await deleteDoc(clientDoc);
        setClients(clients.filter(client => client.id !== id));
        showNotification('Cliente eliminado con éxito.', 'success');
      } catch (error) {
        console.error("Error deleting client: ", error);
        showNotification('Error al eliminar cliente.', 'error');
        logError(error, 'Clients - handleDelete'); // Log the error
      }
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/clientes/${id}`);
  };

  const handleAddClient = () => {
    navigate('/clientes/add');
  };

  const handleEditClient = (id) => {
    navigate(`/clientes/edit/${id}`);
  };

  const canAdd = userRole === 'administrador' || userRole === 'tecnico';
  const canManage = userRole === 'administrador';

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 md:gap-0">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="w-full p-3 pl-10 rounded-xl border border-gray-300 focus:ring-amber-500 focus:border-amber-500 transition-all form-input bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        {canAdd && (
          <motion.button
            onClick={handleAddClient}
            className="bg-amber-600 text-white px-5 py-3 rounded-xl shadow-md hover:bg-amber-700 transition-all flex items-center gap-2 w-full md:w-auto transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Cliente</span>
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200">
        {filteredClients.length === 0 ? (
          <motion.p
            className="text-center text-gray-500 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No se encontraron clientes.
          </motion.p>
        ) : (
          <div className="responsive-table-container">
            <table className="responsive-table divide-y divide-gray-200 w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Dirección</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredClients.map((client) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-1 md:gap-2">
                        <Building2 className="w-3 h-3 md:w-4 md:h-4 text-amber-500" /> {client.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{client.contact}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Phone className="w-3 h-3 md:w-4 md:h-4 text-gray-500" /> {client.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Mail className="w-3 h-3 md:w-4 md:h-4 text-gray-500" /> {client.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">{client.address}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {client.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-1 md:space-x-2">
                          <motion.button
                            onClick={() => handleViewDetails(client.id)}
                            className="text-purple-600 hover:text-purple-900 p-1 md:p-2 rounded-full hover:bg-purple-100 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                          {canManage && (
                            <>
                              <motion.button
                                onClick={() => handleEditClient(client.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 md:p-2 rounded-full hover:bg-blue-100 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4 md:w-5 md:h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDelete(client.id)}
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

export default Clients;