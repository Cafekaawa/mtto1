import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Wrench, Calendar, User, Coffee, Eye, Check, X, ListChecks, Package, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const serviceChecklists = {
  'Cafetera': {
    'Mantenimiento Preventivo': [
      'Cambio de empaques: grupos, electroválvulas y llaves de vapor',
      'Limpieza de duchas',
      'Cambio de válvula antiremolino (de alivio)',
      'Limpieza de electroválvulas',
      'Limpieza de chasis',
      'Recalibración de presostato',
      'Recalibración de bomba',
      'Lavado de manguera de desagüe',
      'Lavado de espreas de grupo',
      'Limpieza de sonda de nivel',
      'Limpieza exterior',
      'Engrasado de llaves en general',
    ],
    'Mantenimiento General': [
      'Descalcificación de Caldera y tuberías en general (desmonte de toda la máquina)',
      'Pulido de caldera y tuberías',
      'Cambio de empaques: grupos, electroválvulas, lancetas, grifo de agua y bloque de válvulas',
      'Cambio de duchas',
      'Cambio de válvula antiremolino (de alivio)',
      'Limpieza de electroválvulas',
      'Limpieza profunda de chasis',
      'Recalibración de presostato',
      'Recalibración de bomba',
      'Cambio de manguera de entrada de agua',
      'Cambio de manguera de desagüe',
      'Cambio de espreas de grupo',
    ],
    'Reconstrucción': [
      'Descalcificación de Caldera y tuberías en general (desmonte de toda la máquina)',
      'Pulido de caldera y tuberías',
      'Cambio de empaques: grupos, electroválvulas, lancetas, grifo de agua y bloque de válvulas',
      'Cambio de duchas',
      'Cambio de válvula antiremolino (de alivio)',
      'Limpieza de electroválvulas',
      'Limpieza profunda de chasis',
      'Recalibración de presostato',
      'Recalibración de bomba',
      'Cambio de manguera de entrada de agua',
      'Cambio de manguera de desagüe',
      'Cambio de espreas de grupo',
      'Resanado de chasis y paneles',
      'Pintura de todo el chasis',
      'Pintura de paneles laterales',
    ],
  },
  'Molino': {
    'Mantenimiento Preventivo': [
      'Limpieza de tolva',
      'Limpieza de muelas y cámara de molienda',
      'Recalibración de molienda',
    ],
    'Mantenimiento General': [
      'Limpieza de tolva',
      'Limpieza de muelas y cámara de molienda',
      'Recalibración de molienda',
    ],
    'Reconstrucción': [
      'Limpieza de tolva',
      'Limpieza de muelas y cámara de molienda',
      'Recalibración de molienda',
      'Resanado de chasis y paneles',
      'Pintura de chasis y paneles',
    ],
  },
};

const AddEditService = ({ showNotification, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]); // State for technicians to select from
  const [formData, setFormData] = useState({
    folio: '', // New field for service folio
    clientId: '',
    equipmentId: '',
    type: '',
    machineType: '',
    dateStart: '',
    dateEnd: '',
    status: 'Pendiente',
    checklist: {},
    partsUsed: [], // Now an array of objects { quantity, description, price, included }
    description: '',
    nextServiceComments: '',
    technician: currentUser ? currentUser.fullName : 'Desconocido', // Creator of the service
    assignedTechnician: currentUser ? currentUser.fullName : '', // Assigned technician (defaults to creator)
  });
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [newPart, setNewPart] = useState({ quantity: 1, description: '', price: 0, included: true });

  const isEditing = !!id;

  // Mock user data for technicians (should come from a user management system in real app)
  const mockUsers = [
    { username: 'carlos', role: 'tecnico', fullName: 'Carlos Hernandez Valencia' },
    { username: 'jonathan', role: 'administrador', fullName: 'Jonathan Valencia Quintal' },
    { username: 'miguel', role: 'administrador', fullName: 'Jose Miguel Fernandez Perez' },
  ];

  // Function to generate a random 6-digit folio
  const generateRandomFolio = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit number
  };

  // Fetch clients, equipment, and technicians for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsData = await getDocs(collection(db, "clients"));
        setClients(clientsData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));

        const equipmentData = await getDocs(collection(db, "equipment"));
        setAllEquipment(equipmentData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));

        // Filter users to get technicians (and admins who can also be assigned)
        const techUsers = mockUsers.filter(user => user.role === 'tecnico' || user.role === 'administrador');
        setTechnicians(techUsers);

      } catch (error) {
        console.error("Error fetching data: ", error);
        showNotification('Error al cargar datos.', 'error');
      }
    };
    fetchData();
  }, [showNotification]);

  // Load service data if editing or generate new folio if adding
  useEffect(() => {
    const initializeForm = async () => {
      if (isEditing) {
        try {
          const serviceDocRef = doc(db, "services", id);
          const serviceDocSnap = await getDoc(serviceDocRef);
          if (serviceDocSnap.exists()) {
            const data = serviceDocSnap.data();
            setFormData(data);
            // Set selected client and filter available equipment
            if (data.clientId) {
              setAvailableEquipment(allEquipment.filter(eq => eq.client === data.clientId && eq.status !== 'no disponible'));
            }
          } else {
            showNotification('Servicio no encontrado.', 'error');
            navigate('/servicios');
          }
        } catch (error) {
          console.error("Error fetching service for edit: ", error);
          showNotification('Error al cargar datos del servicio.', 'error');
        }
      } else {
        // Generate new random folio for new service
        setFormData(prev => ({ 
          ...prev, 
          folio: generateRandomFolio(), // Generate random folio
          assignedTechnician: currentUser ? currentUser.fullName : '', // Set assignedTechnician to current user's full name
        }));
      }
    };
    if (allEquipment.length > 0 || !isEditing) { // Ensure equipment is loaded before trying to filter, or if adding new service
      initializeForm();
    }
  }, [id, isEditing, navigate, showNotification, allEquipment, currentUser]); // Added currentUser to dependencies

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setFormData(prev => ({ ...prev, clientId: clientId, equipmentId: '', machineType: '' })); // Reset equipment and machineType
    if (clientId) {
      setAvailableEquipment(allEquipment.filter(eq => eq.client === clientId && eq.status !== 'no disponible'));
    } else {
      setAvailableEquipment([]);
    }
  };

  const handleEquipmentChange = (e) => {
    const equipmentId = e.target.value;
    const selectedEq = allEquipment.find(eq => eq.id === equipmentId);
    setFormData(prev => ({ ...prev, equipmentId: equipmentId, machineType: selectedEq ? selectedEq.type : '' }));
    // Reset checklist when equipment changes
    setFormData(prev => ({ ...prev, checklist: {} }));
  };

  const handleServiceTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({ ...prev, type: type }));
    const currentMachineType = formData.machineType;
    const checklistItems = serviceChecklists[currentMachineType]?.[type] || [];
    const initialChecklistState = {};
    checklistItems.forEach(item => {
      initialChecklistState[item] = false;
    });
    setFormData(prev => ({ ...prev, checklist: initialChecklistState }));
  };

  const handleChecklistItemChange = (item) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [item]: !prev.checklist[item] }
    }));
  };

  const handleNewPartChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPart(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleAddPart = () => {
    if (newPart.description.trim()) {
      setFormData(prev => ({ ...prev, partsUsed: [...prev.partsUsed, newPart] }));
      setNewPart({ quantity: 1, description: '', price: 0, included: true }); // Reset for next part
    }
  };

  const handleRemovePart = (indexToRemove) => {
    setFormData(prev => ({ ...prev, partsUsed: prev.partsUsed.filter((_, index) => index !== indexToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const serviceDoc = doc(db, "services", id);
        await updateDoc(serviceDoc, formData);
        showNotification('Servicio modificado con éxito.', 'success');
      } else {
        const docRef = await addDoc(collection(db, "services"), formData);
        // No need to update serviceCounter metadata for random folios
        showNotification('Servicio programado con éxito.', 'success');
      }
      navigate('/servicios');
    } catch (error) {
      console.error("Error saving service: ", error);
      showNotification('Error al guardar servicio.', 'error');
    }
  };

  // Determine if the assignedTechnician field should be disabled
  const isAssignedTechnicianDisabled = !isEditing || (currentUser && currentUser.role !== 'administrador');

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

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
          {isEditing ? 'Editar Servicio' : 'Programar Nuevo Servicio'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <label htmlFor="folio" className="block text-sm font-medium text-gray-700 mb-1">Folio de Servicio</label>
            <input
              type="text"
              id="folio"
              name="folio"
              value={formData.folio}
              className="form-input border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
              disabled={isEditing} // Disable folio input if editing
            />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleClientChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            >
              <option value="">Seleccione un cliente...</option>
              {clients.filter(c => c.isActive).map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="equipmentId" className="block text-sm font-medium text-gray-700 mb-1">Máquina Asignada <span className="text-red-500">*</span></label>
            <select
              id="equipmentId"
              name="equipmentId"
              value={formData.equipmentId}
              onChange={handleEquipmentChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
              disabled={!formData.clientId || availableEquipment.length === 0}
            >
              <option value="">Seleccione una máquina...</option>
              {availableEquipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.brand} {eq.model} ({eq.serial})</option>
              ))}
            </select>
            {formData.clientId && availableEquipment.length === 0 && (
              <p className="text-sm text-red-500 mt-1">No hay máquinas disponibles para este cliente.</p>
            )}
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio <span className="text-red-500">*</span></label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleServiceTypeChange}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
              disabled={!formData.machineType}
            >
              <option value="">Seleccione un tipo...</option>
              {formData.machineType && Object.keys(serviceChecklists[formData.machineType] || {}).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {!formData.machineType && (
              <p className="text-sm text-red-500 mt-1">Seleccione una máquina para ver los tipos de servicio.</p>
            )}
          </div>
          <div>
            <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="dateStart"
              name="dateStart"
              value={formData.dateStart}
              onChange={(e) => setFormData(prev => ({ ...prev, dateStart: e.target.value }))}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Finalización</label>
            <input
              type="date"
              id="dateEnd"
              name="dateEnd"
              value={formData.dateEnd}
              onChange={(e) => setFormData(prev => ({ ...prev, dateEnd: e.target.value }))}
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label htmlFor="assignedTechnician" className="block text-sm font-medium text-gray-700 mb-1">Técnico Asignado <span className="text-red-500">*</span></label>
            <select
              id="assignedTechnician"
              name="assignedTechnician"
              value={formData.assignedTechnician}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTechnician: e.target.value }))}
              className={`form-select border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 ${isAssignedTechnicianDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
              disabled={isAssignedTechnicianDisabled}
            >
              <option value="">Seleccione un técnico...</option>
              {technicians.map(tech => (
                <option key={tech.fullName} value={tech.fullName}>{tech.fullName}</option>
              ))}
            </select>
            {isAssignedTechnicianDisabled && (
              <p className="text-xs text-gray-500 mt-1">Solo los administradores pueden cambiar el técnico asignado.</p>
            )}
          </div>

          {formData.machineType && formData.type && serviceChecklists[formData.machineType]?.[formData.type] && (
            <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><ListChecks className="w-5 h-5" /> Checklist de {formData.type} para {formData.machineType}</h3>
              {serviceChecklists[formData.machineType][formData.type].map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`checklist-${index}`}
                    checked={formData.checklist[item] || false}
                    onChange={() => handleChecklistItemChange(item)}
                    className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor={`checklist-${index}`} className="ml-2 text-sm font-medium text-gray-700">{item}</label>
                </div>
              ))}
            </div>
          )}

          <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Piezas Usadas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3 items-end">
              <div>
                <label htmlFor="newPartQuantity" className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  id="newPartQuantity"
                  name="quantity"
                  value={newPart.quantity}
                  onChange={handleNewPartChange}
                  className="form-input w-full border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  min="1"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="newPartDescription" className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input
                  type="text"
                  id="newPartDescription"
                  name="description"
                  value={newPart.description}
                  onChange={handleNewPartChange}
                  className="form-input w-full border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Descripción de la pieza"
                />
              </div>
              <div>
                <label htmlFor="newPartPrice" className="block text-xs font-medium text-gray-600 mb-1">Precio</label>
                <input
                  type="number"
                  id="newPartPrice"
                  name="price"
                  value={newPart.price}
                  onChange={handleNewPartChange}
                  className="form-input w-full border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex items-center sm:col-span-4">
                <input
                  type="checkbox"
                  id="newPartIncluded"
                  name="included"
                  checked={newPart.included}
                  onChange={handleNewPartChange}
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="newPartIncluded" className="ml-2 text-sm font-medium text-gray-700">Incluido en el servicio</label>
              </div>
              <motion.button
                type="button"
                onClick={handleAddPart}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors w-full sm:col-span-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Agregar Pieza
              </motion.button>
            </div>
            {formData.partsUsed.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Lista de Piezas:</h4>
                <ul className="space-y-2">
                  {formData.partsUsed.map((part, index) => (
                    <motion.li
                      key={index}
                      className="flex flex-wrap items-center justify-between bg-white p-3 rounded-md border border-gray-100"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{part.quantity}x {part.description}</p>
                        <p className="text-xs text-gray-600">Precio: ${part.price.toFixed(2)} {part.included ? '(Incluido)' : '(Extra)'}</p>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => handleRemovePart(index)}
                        className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-100"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción del Servicio (Opcional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="nextServiceComments" className="block text-sm font-medium text-gray-700 mb-1">Comentarios para el Próximo Servicio (Opcional)</label>
            <textarea
              id="nextServiceComments"
              name="nextServiceComments"
              value={formData.nextServiceComments}
              onChange={(e) => setFormData(prev => ({ ...prev, nextServiceComments: e.target.value }))}
              rows="3"
              className="form-input border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
          </div>

          <div className="md:col-span-2 flex justify-end space-x-2 md:space-x-3 mt-4 md:mt-6">
            <motion.button
              type="button"
              onClick={() => navigate('/servicios')}
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
              {isEditing ? 'Guardar Cambios' : 'Guardar Servicio'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddEditService;