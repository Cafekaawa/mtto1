import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeft } from 'lucide-react';

const AddEditEquipment = ({ showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allClients, setAllClients] = useState([]); // Store all clients
  const [activeClients, setActiveClients] = useState([]); // Store only active clients for dropdown
  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    serial: '',
    purchaseDate: '',
    invoiceNumber: '',
    currentStatus: '', // Now a select with specific options
    status: 'disponible', // Default status, will be auto-set
    client: '', // Client ID
    lastService: '',
    lastServiceType: '', // Now a select with specific options
    isNewInstallation: false,
    installationDate: '',
    notes: '',
  });

  const isEditing = !!id;

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsCollection = collection(db, "clients");
        const clientSnapshot = await getDocs(clientsCollection);
        const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, isActive: doc.data().isActive }));
        setAllClients(clientsData);
        setActiveClients(clientsData.filter(c => c.isActive)); // Filter active clients for dropdown
      } catch (error) {
        console.error("Error fetching clients: ", error);
        showNotification('Error al cargar clientes.', 'error');
      }
    };

    const getEquipment = async () => {
      if (isEditing) {
        try {
          const equipmentDocRef = doc(db, "equipment", id);
          const equipmentDocSnap = await getDoc(equipmentDocRef);
          if (equipmentDocSnap.exists()) {
            setFormData(equipmentDocSnap.data());
          } else {
            showNotification('Equipo no encontrado.', 'error');
            navigate('/equipos');
          }
        } catch (error) {
          console.error("Error fetching equipment for edit: ", error);
          showNotification('Error al cargar datos del equipo.', 'error');
        }
      }
    };
    fetchClients();
    getEquipment();
  }, [id, isEditing, navigate, showNotification]);

  // Effect to automatically set equipment status based on client assignment
  useEffect(() => {
    setFormData(prev => {
      const newStatus = prev.client ? 'asignado' : 'disponible';
      if (prev.status !== newStatus) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });
  }, [formData.client]); // Re-run when client changes

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const equipmentDoc = doc(db, "equipment", id);
        await updateDoc(equipmentDoc, formData);
        showNotification('Equipo modificado con éxito.', 'success');
      } else {
        await addDoc(collection(db, "equipment"), formData);
        showNotification('Equipo agregado con éxito.', 'success');
      }
      navigate('/equipos');
    } catch (error) {
      console.error("Error saving equipment: ", error);
      showNotification('Error al guardar equipo.', 'error');
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

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
          {isEditing ? 'Editar Equipo' : 'Agregar Nuevo Equipo'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo <span className="text-red-500">*</span></label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            >
              <option value="">Seleccione un tipo...</option>
              <option value="Cafetera">Cafetera</option>
              <option value="Molino">Molino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Marca <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="serial" className="block text-sm font-medium text-gray-700 mb-1">Número de Serie <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="serial"
              name="serial"
              value={formData.serial}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Compra</label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
            <input
              type="text"
              id="invoiceNumber"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700 mb-1">Estado Actual del Equipo</label>
            <select
              id="currentStatus"
              name="currentStatus"
              value={formData.currentStatus}
              onChange={handleChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Seleccione un estado...</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Seminuevo">Seminuevo</option>
              <option value="Usado">Usado</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado del Equipo <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="status"
              name="status"
              value={formData.status}
              readOnly
              disabled
              className="form-input border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Cliente Asignado</label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Seleccione un cliente...</option>
              {activeClients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lastService" className="block text-sm font-medium text-gray-700 mb-1">Fecha Último Servicio</label>
            <input
              type="date"
              id="lastService"
              name="lastService"
              value={formData.lastService}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label htmlFor="lastServiceType" className="block text-sm font-medium text-gray-700 mb-1">Tipo Último Servicio</label>
            <select
              id="lastServiceType"
              name="lastServiceType"
              value={formData.lastServiceType}
              onChange={handleChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Seleccione un tipo...</option>
              <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
              <option value="Mantenimiento General">Mantenimiento General</option>
              <option value="Reconstruccion">Reconstrucción</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center">
            <input
              type="checkbox"
              id="isNewInstallation"
              name="isNewInstallation"
              checked={formData.isNewInstallation}
              onChange={handleChange}
              className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="isNewInstallation" className="ml-2 text-sm font-medium text-gray-700">¿Es Nueva Instalación?</label>
          </div>
          {formData.isNewInstallation && (
            <div>
              <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Instalación</label>
              <input
                type="date"
                id="installationDate"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleChange}
                className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas del Equipo</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
          </div>
          <div className="md:col-span-2 flex justify-end space-x-2 md:space-x-3 mt-4 md:mt-6">
            <motion.button
              type="button"
              onClick={() => navigate('/equipos')}
              className="px-4 py-2 md:px-5 md:py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              className="bg-amber-600 text-white px-4 py-2 md:px-5 md:py-2 rounded-lg shadow-md hover:bg-amber-700 transition-colors text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? 'Guardar Cambios' : 'Agregar Equipo'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddEditEquipment;