import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Users, Wrench, FileText, UserCheck, CalendarDays } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError';

const Dashboard = ({ showNotification, userRole }) => {
  const [stats, setStats] = useState([
    { name: 'Clientes Activos', value: '...', icon: Users, color: 'from-blue-500 to-blue-600' },
    { name: 'Equipos Registrados', value: '...', icon: Coffee, color: 'from-green-500 to-green-600' },
    { name: 'Servicios Pendientes', value: '...', icon: Wrench, color: 'from-yellow-500 to-yellow-600' },
    { name: 'Reportes Generados', value: '...', icon: FileText, color: 'from-purple-500 to-purple-600' },
  ]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [technicianMetrics, setTechnicianMetrics] = useState([]);
  const [clients, setClients] = useState([]); // To map client IDs to names
  const [equipment, setEquipment] = useState([]); // To map equipment IDs to names

  const users = [ // Mock users for technician names
    { username: 'carlos', role: 'tecnico', fullName: 'Carlos Hernandez Valencia' },
    { username: 'jonathan', role: 'administrador', fullName: 'Jonathan Valencia Quintal' },
    { username: 'admin', role: 'administrador', fullName: 'Administrador Kaawa' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Clients
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        const clientsData = clientsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setClients(clientsData);
        const activeClients = clientsData.filter(doc => doc.isActive).length;
        
        // Fetch Equipment
        const equipmentSnapshot = await getDocs(collection(db, "equipment"));
        const equipmentData = equipmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setEquipment(equipmentData);
        const totalEquipment = equipmentData.length;

        // Fetch Services
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const allServices = servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const completedServices = allServices.filter(s => s.status === 'Completado');
        const pendingServices = allServices.filter(s => s.status === 'Pendiente').length;
        
        // Mock for Reports (as reports are generated, not stored as a count)
        const generatedReports = 567; // Placeholder for now

        setStats(prevStats => prevStats.map(stat => {
          if (stat.name === 'Clientes Activos') return { ...stat, value: activeClients };
          if (stat.name === 'Equipos Registrados') return { ...stat, value: totalEquipment };
          if (stat.name === 'Servicios Pendientes') return { ...stat, value: pendingServices };
          if (stat.name === 'Reportes Generados') return { ...stat, value: generatedReports };
          return stat;
        }));

        // Helper functions to get names
        const getClientName = (clientId) => clientsData.find(c => c.id === clientId)?.name || 'N/A';
        const getEquipmentName = (equipmentId) => {
          const eq = equipmentData.find(e => e.id === equipmentId);
          return eq ? `${eq.brand} ${eq.model}` : 'N/A';
        };

        // Upcoming Services (within 8 months)
        const eightMonthsFromNow = new Date();
        eightMonthsFromNow.setMonth(eightMonthsFromNow.getMonth() + 8);

        const upcomingServicesData = allServices
          .filter(s => ['Pendiente', 'En Progreso'].includes(s.status) && new Date(s.dateStart) <= eightMonthsFromNow)
          .sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart))
          .slice(0, 5) // Limit to 5 upcoming services
          .map(s => ({
            text: `${getEquipmentName(s.equipmentId)} (${getClientName(s.clientId)})`,
            date: s.dateStart,
          }));
        setUpcomingServices(upcomingServicesData);

        // Technician Metrics (Admin only)
        if (userRole === 'administrador') {
          const techMetrics = {};
          users.filter(u => u.role === 'tecnico' || u.role === 'administrador').forEach(tech => { // Include admins who might also do services
            techMetrics[tech.fullName] = { completed: 0, pending: 0 };
          });

          allServices.forEach(s => {
            // Use assignedTechnician if available, otherwise fallback to technician (creator)
            const techName = s.assignedTechnician || s.technician; 
            if (techName && techMetrics[techName]) { 
              if (s.status === 'Completado') {
                techMetrics[techName].completed++;
              } else if (s.status === 'Pendiente' || s.status === 'En Progreso') {
                techMetrics[techName].pending++;
              }
            }
          });

          setTechnicianMetrics(Object.entries(techMetrics).map(([name, data]) => ({ name, ...data })));
        }

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
        showNotification('Error al cargar datos del dashboard.', 'error');
        logError(error, 'Dashboard - fetchData');
      }
    };

    fetchData();
  }, [showNotification, userRole]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="dashboard-stats-grid gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 md:p-6 text-white shadow-lg flex items-center justify-between transform hover:scale-105 transition-all duration-300 ease-in-out`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.03, rotate: 1 }}
          >
            <div>
              <p className="text-sm font-medium opacity-80">{stat.name}</p>
              <p className="text-3xl md:text-4xl font-bold mt-1">{stat.value}</p>
            </div>
            <stat.icon className="w-10 h-10 md:w-12 md:h-12 opacity-30" />
          </motion.div>
        ))}
      </div>

      {userRole === 'administrador' && (
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-600" /> Métricas de Técnicos
          </h2>
          {technicianMetrics.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No hay métricas de técnicos disponibles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Técnico</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Servicios Completados</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Servicios Pendientes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {technicianMetrics.map((tech, index) => (
                    <motion.tr
                      key={tech.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{tech.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tech.completed}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{tech.pending}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 md:gap-6"> {/* Changed to grid-cols-1 */}
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-600" /> Próximos Servicios (8 meses)
          </h2>
          <ul className="space-y-3 md:space-y-4">
            {upcomingServices.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay servicios próximos.</p>
            ) : (
              upcomingServices.map((service, index) => (
                <motion.li
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm md:text-base hover:bg-amber-100 transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                >
                  <span className="text-amber-800 font-medium">{service.text}</span>
                  <span className="text-xs sm:text-sm text-amber-600 mt-1 sm:mt-0">{service.date}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;