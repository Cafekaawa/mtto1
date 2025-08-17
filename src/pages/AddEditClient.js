import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeft } from 'lucide-react';

const AddEditClient = ({ showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    isActive: true,
  });

  const isEditing = !!id;

  // Fetch client data if editing
  useEffect(() => {
    const getClient = async () => {
      if (isEditing) {
        try {
          const clientDocRef = doc(db, "clients", id);
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            setFormData(clientDocSnap.data());
          } else {
            showNotification('Cliente no encontrado.', 'error');
            navigate('/clientes');
          }
        } catch (error) {
          console.error("Error fetching client for edit: ", error);
          showNotification('Error al cargar datos del cliente.', 'error');
        }
      }
    };
    getClient();
  }, [id, isEditing, navigate, showNotification]);

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
        const clientDoc = doc(db, "clients", id);
        await updateDoc(clientDoc, formData);
        showNotification('Cliente modificado con éxito.', 'success');
      } else {
        await addDoc(collection(db, "clients"), formData);
        showNotification('Cliente agregado con éxito.', 'success');
      }
      navigate('/clientes');
    } catch (error) {
      console.error("Error saving client: ", error);
      showNotification('Error al guardar cliente.', 'error');
    }
  };

  return (
    <motion.div
      className="p-4 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        onClick={() => navigate('/clientes')}
        className="mb-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-all flex items-center gap-2 text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Clientes
      </motion.button>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
          {isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">Cliente Activo</label>
          </div>
          
          <div className="md:col-span-2 flex justify-end space-x-2 md:space-x-3 mt-4 md:mt-6">
            <motion.button
              type="button"
              onClick={() => navigate('/clientes')}
              className="px-4 py-2 md:px-5 md:py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 md:px-5 md:py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? 'Guardar Cambios' : 'Agregar Cliente'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddEditClient;