import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Users, Wrench, FileText, UserCheck, CalendarDays, Clock, History, AlertTriangle, PieChart, MapPin } from 'lucide-react'; // Added MapPin icon
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError';

const Dashboard = ({ showNotification, userRole }) => {
  const [stats, setStats] = useState([
    { name: 'Clientes Activos', value: '...', icon: Users, color: 'from-blue-500 to-blue-600' },
    { name: 'Equipos Registrados', value: '...', icon: Coffee, color: 'from-green-500 to-green-600' },
    { name: 'Servicios Pendientes', value: '...', icon: Wrench, color: 'from-yellow-500 to-yellow-600' },
  ]);
  const [upcomingServices8Months, setUpcomingServices8Months] = useState([]);
  const [upcomingServices2Months, setUpcomingServices2Months] = useState([]);
  const [overdueEquipment, setOverdueEquipment] = useState([]);
  const [latestServices, setLatestServices] = useState([]);
  const [recentEquipment, setRecentEquipment] = useState([]);
  const [servicesByType, setServicesByType] = useState([]);
  const [clientsByZone, setClientsByZone] = useState([]); // New state for clients by zone
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
        const pendingServicesCount = allServices.filter(s => s.status === 'Pendiente' || s.status === 'En Progreso').length;
        
        setStats(prevStats => prevStats.map(stat => {
          if (stat.name === 'Clientes Activos') return { ...stat, value: activeClients };
          if (stat.name === 'Equipos Registrados') return { ...stat, value: totalEquipment };
          if (stat.name === 'Servicios Pendientes') return { ...stat, value: pendingServicesCount };
          return stat;
        }));

        // Helper functions to get names
        const getClientName = (clientId) => clientsData.find(c => c.id === clientId)?.name || 'N/A';
        const getEquipmentName = (equipmentId) => {
          const eq = equipmentData.find(e => e.id === equipmentId);
          return eq ? `${eq.brand} ${eq.model}` : 'N/A';
        };

        // --- Calculate Upcoming Services (8 months) and Overdue Equipment ---
        const upcoming8 = [];
        const upcoming2 = [];
        const overdue = [];
        const eightMonthsInMs = 8 * 30.44 * 24 * 60 * 60 * 1000; // Approximate 8 months average
        const twoMonthsInMs = 2 * 30.44 * 24 * 60 * 60 * 1000; // Approximate 2 months average
        const today = new Date();
        const twoMonthsFromNow = new Date(today.getTime() + twoMonthsInMs);

        for (const eq of equipmentData) {
          // 1. Try to get the latest completed service date from the services module
          const latestServiceForEquipment = allServices
            .filter(s => s.equipmentId === eq.id && s.status === 'Completado' && s.dateEnd)
            .sort((a, b) => new Date(b.dateEnd) - new Date(a.dateEnd))[0];

          let lastKnownDate = null;
          if (latestServiceForEquipment) {
            lastKnownDate = new Date(latestServiceForEquipment.dateEnd);
          } else if (eq.lastService) { // 2. Fallback to lastService field in equipment
            lastKnownDate = new Date(eq.lastService);
          } else if (eq.isNewInstallation && eq.installationDate) { // 3. Fallback to installationDate
            lastKnownDate = new Date(eq.installationDate);
          } else if (eq.purchaseDate) { // 4. Fallback to purchaseDate
            lastKnownDate = new Date(eq.purchaseDate);
          }

          if (lastKnownDate) {
            const nextServiceDate = new Date(lastKnownDate.getTime() + eightMonthsInMs);
            
            // Check for Overdue Equipment
            if (nextServiceDate < today) {
              overdue.push({
                text: `${getEquipmentName(eq.id)} (${getClientName(eq.client)})`,
                date: nextServiceDate.toISOString().split('T')[0],
                sortDate: nextServiceDate,
              });
            } 
            // Check for Upcoming Services (8 months)
            else if (nextServiceDate > today) {
              upcoming8.push({
                text: `${getEquipmentName(eq.id)} (${getClientName(eq.client)})`,
                date: nextServiceDate.toISOString().split('T')[0],
                sortDate: nextServiceDate,
              });

              // Check for Upcoming Services (2 months)
              if (nextServiceDate <= twoMonthsFromNow) {
                upcoming2.push({
                  text: `${getEquipmentName(eq.id)} (${getClientName(eq.client)})`,
                  date: nextServiceDate.toISOString().split('T')[0],
                  sortDate: nextServiceDate,
                });
              }
            }
          }
        }
        
        // Sort and set states
        setUpcomingServices8Months(upcoming8.sort((a, b) => a.sortDate - b.sortDate).slice(0, 5));
        setUpcomingServices2Months(upcoming2.sort((a, b) => a.sortDate - b.sortDate).slice(0, 5));
        setOverdueEquipment(overdue.sort((a, b) => a.sortDate - b.sortDate).slice(0, 5));


        // Top 5 Latest Services
        const latestCompletedServices = allServices
          .filter(s => s.status === 'Completado' && s.dateEnd) // Ensure dateEnd exists
          .sort((a, b) => new Date(b.dateEnd) - new Date(a.dateEnd)) // Sort by completion date descending
          .slice(0, 5)
          .map(s => ({
            text: `${s.type} para ${getEquipmentName(s.equipmentId)} (${getClientName(s.clientId)})`,
            date: s.dateEnd,
          }));
        setLatestServices(latestCompletedServices);

        // Most Recent Equipment Added to System (sorted by purchaseDate as a proxy for entry date)
        const recentEq = equipmentData
          .filter(eq => eq.purchaseDate) // Only consider equipment with a purchase date
          .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)) // Sort by most recent purchase date (descending)
          .slice(0, 5) // Get the top 5 most recent
          .map(eq => ({
            text: `${eq.brand} ${eq.model} (${getClientName(eq.client)})`,
            date: eq.purchaseDate,
          }));
        setRecentEquipment(recentEq);

        // Services by Type
        const servicesByTypeCounts = allServices.reduce((acc, service) => {
          if (service.type) {
            acc[service.type] = (acc[service.type] || 0) + 1;
          }
          return acc;
        }, {});
        setServicesByType(Object.entries(servicesByTypeCounts).map(([type, count]) => ({ type, count })));

        // Clients by Zone
        const clientsByZoneCounts = clientsData.reduce((acc, client) => {
          const zone = client.zone || 'Desconocida'; // Default to 'Desconocida' if zone is not set
          acc[zone] = (acc[zone] || 0) + 1;
          return acc;
        }, {});
        setClientsByZone(Object.entries(clientsByZoneCounts).map(([zone, count]) => ({ zone, count })));


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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
            {upcomingServices8Months.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay servicios próximos.</p>
            ) : (
              upcomingServices8Months.map((service, index) => (
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

        {/* New section for Upcoming Services (2 Months) */}
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-green-600" /> Próximos Servicios (2 meses)
          </h2>
          <ul className="space-y-3 md:space-y-4">
            {upcomingServices2Months.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay servicios próximos en los siguientes 2 meses.</p>
            ) : (
              upcomingServices2Months.map((service, index) => (
                <motion.li
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 text-sm md:text-base hover:bg-green-100 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                >
                  <span className="text-green-800 font-medium">{service.text}</span>
                  <span className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-0">{service.date}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        {/* New section for Top 5 Latest Services */}
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" /> Top 5 Últimos Servicios Realizados
          </h2>
          <ul className="space-y-3 md:space-y-4">
            {latestServices.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay servicios recientes para mostrar.</p>
            ) : (
              latestServices.map((service, index) => (
                <motion.li
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm md:text-base hover:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.0 + index * 0.05 }}
                >
                  <span className="text-gray-700">{service.text}</span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">{service.date}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>

        {/* New section for Most Recent Equipment Added to System */}
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" /> Equipos Más Recientes en Sistema
          </h2>
          <ul className="space-y-3 md:space-y-4">
            {recentEquipment.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay equipos con fecha de compra registrada.</p>
            ) : (
              recentEquipment.map((eq, index) => (
                <motion.li
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm md:text-base hover:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.2 + index * 0.05 }}
                >
                  <span className="text-gray-700">{eq.text}</span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Factura: {eq.date}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        {/* New section for Overdue Equipment */}
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" /> Equipos con Servicios Retrasados
          </h2>
          <ul className="space-y-3 md:space-y-4">
            {overdueEquipment.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">¡Excelente! No hay equipos con servicios retrasados.</p>
            ) : (
              overdueEquipment.map((eq, index) => (
                <motion.li
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 text-sm md:text-base hover:bg-red-100 transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.4 + index * 0.05 }}
                >
                  <span className="text-red-800 font-medium">{eq.text}</span>
                  <span className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-0">Próximo servicio: {eq.date}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>

        {/* New section for Services by Type */}
        <motion.div
          className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" /> Servicios por Tipo
          </h2>
          <ul className="space-y-3 md:space-y-4">
            {servicesByType.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay datos de servicios por tipo.</p>
            ) : (
              servicesByType.map((item, index) => (
                <motion.li
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm md:text-base hover:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.6 + index * 0.05 }}
                >
                  <span className="text-gray-700 font-medium">{item.type}</span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Total: {item.count}</span>
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      {/* New section for Clients by Zone */}
      <motion.div
        className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200 mt-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.7 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3 border-gray-200 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-orange-600" /> Clientes por Zona
        </h2>
        <ul className="space-y-3 md:space-y-4">
          {clientsByZone.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No hay datos de clientes por zona.</p>
          ) : (
            clientsByZone.map((item, index) => (
              <motion.li
                key={index}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm md:text-base hover:bg-gray-100 transition-colors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.8 + index * 0.05 }}
              >
                <span className="text-gray-700 font-medium">{item.zone}</span>
                <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Clientes: {item.count}</span>
              </motion.li>
            ))
          )}
        </ul>
      </motion.div>
    </div>
  );
};

export default Dashboard;