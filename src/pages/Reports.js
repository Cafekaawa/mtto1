import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Filter, CalendarDays, Bug } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError'; // Import logError

const Reports = ({ showNotification }) => {
  const [reportType, setReportType] = useState('servicios');
  const [dateRange, setDateRange] = useState('mes');
  const [generatedReports, setGeneratedReports] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]); // New state for error logs
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);

  // Fetch clients and equipment to map IDs to names
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const clientsData = await getDocs(collection(db, "clients"));
        setClients(clientsData.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        const equipmentData = await getDocs(collection(db, "equipment"));
        setEquipment(equipmentData.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching related data for reports: ", error);
        showNotification('Error al cargar datos relacionados para reportes.', 'error');
        logError(error, 'Reports - fetchRelatedData'); // Log the error
      }
    };
    fetchRelatedData();
  }, [showNotification]);

  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.name || 'N/A';
  const getEquipmentInfo = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? `${eq.brand} ${eq.model} (${eq.serial})` : 'N/A';
  };

  // Function to fetch data based on report type and date range
  const fetchReportData = async () => {
    let data = [];
    try {
      if (reportType === 'servicios') {
        const servicesSnapshot = await getDocs(collection(db, "services"));
        data = servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Filter by date range (simplified for example)
        const today = new Date();
        data = data.filter(service => {
          const serviceDate = new Date(service.dateStart);
          if (dateRange === 'dia') return serviceDate.toDateString() === today.toDateString();
          if (dateRange === 'semana') return (today - serviceDate) / (1000 * 60 * 60 * 24) <= 7;
          if (dateRange === 'mes') return serviceDate.getMonth() === today.getMonth() && serviceDate.getFullYear() === today.getFullYear();
          if (dateRange === 'trimestre') {
            const currentMonth = today.getMonth();
            const serviceMonth = serviceDate.getMonth();
            const currentQuarter = Math.floor(currentMonth / 3);
            const serviceQuarter = Math.floor(serviceMonth / 3);
            return serviceQuarter === currentQuarter && serviceDate.getFullYear() === today.getFullYear();
          }
          if (dateRange === 'ano') return serviceDate.getFullYear() === today.getFullYear();
          return true;
        });
        setGeneratedReports(data.map(s => ({
          id: s.id,
          title: `Servicio: ${s.type} - ${getClientName(s.clientId)}`,
          date: s.dateStart,
          size: 'N/A' // Placeholder
        })));
      } else if (reportType === 'equipos') {
        const equipmentSnapshot = await getDocs(collection(db, "equipment"));
        data = equipmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setGeneratedReports(data.map(eq => ({
          id: eq.id,
          title: `Equipo: ${eq.brand} ${eq.model} (${eq.serial})`,
          date: eq.purchaseDate || 'N/A',
          size: 'N/A'
        })));
      } else if (reportType === 'clientes') {
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        data = clientsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setGeneratedReports(data.map(c => ({
          id: c.id,
          title: `Cliente: ${c.name} (${c.contact})`,
          date: 'N/A', // No specific date for client creation in mock
          size: 'N/A'
        })));
      } else if (reportType === 'errorLogs') { // Fetch error logs
        const errorLogsQuery = query(collection(db, "errorLogs"), orderBy("timestamp", "desc"));
        const errorLogsSnapshot = await getDocs(errorLogsQuery);
        setErrorLogs(errorLogsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    } catch (error) {
      console.error("Error generating report: ", error);
      showNotification('Error al generar el reporte.', 'error');
      logError(error, 'Reports - fetchReportData'); // Log the error
      setGeneratedReports([]);
      setErrorLogs([]);
    }
  };

  useEffect(() => {
    // Only fetch report data once clients and equipment are loaded
    // and when the component mounts, or reportType/dateRange changes
    if (clients.length > 0 || equipment.length > 0 || reportType === 'errorLogs') {
      fetchReportData();
    }
  }, [reportType, dateRange, clients, equipment]); // Re-fetch when reportType, dateRange, clients or equipment changes

  const downloadReport = () => {
    showNotification('Descargando reporte... (Funcionalidad no implementada)', 'info');
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Generar Nuevo Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
            <div className="relative">
              <select
                id="reportType"
                className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-amber-500 focus:border-amber-500 pr-10 bg-white shadow-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="servicios">Servicios</option>
                <option value="equipos">Equipos</option>
                <option value="clientes">Clientes</option>
                <option value="errorLogs">Logs de Errores</option> {/* New option */}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
          {reportType !== 'errorLogs' && ( // Hide date range for error logs
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
              <div className="relative">
                <select
                  id="dateRange"
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-amber-500 focus:border-amber-500 pr-10 bg-white shadow-sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="dia">Hoy</option>
                  <option value="semana">Última Semana</option>
                  <option value="mes">Último Mes</option>
                  <option value="trimestre">Último Trimestre</option>
                  <option value="ano">Último Año</option>
                </select>
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          )}
          <motion.button
            onClick={fetchReportData} // This line was already correct, but now it's explicitly mentioned
            className="bg-amber-600 text-white px-5 py-3 rounded-xl shadow-md hover:bg-amber-700 transition-all flex items-center justify-center gap-2 mt-4 md:mt-0 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText className="w-5 h-5" />
            <span>Generar Reporte</span>
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {reportType === 'errorLogs' ? 'Logs de Errores' : 'Reportes Generados'}
        </h2>
        {reportType === 'errorLogs' ? (
          errorLogs.length === 0 ? (
            <motion.p
              className="text-center text-gray-500 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay logs de errores. ¡Todo en orden!
            </motion.p>
          ) : (
            <div className="responsive-table-container">
              <table className="responsive-table divide-y divide-gray-200 w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Mensaje</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Componente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Usuario</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {errorLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-red-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{log.message}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">{log.component}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">{log.user?.fullName || 'Anónimo'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <motion.button
                          onClick={() => alert(`Detalles del Error:\n\nMensaje: ${log.message}\nComponente: ${log.component}\nUsuario: ${log.user?.fullName || 'Anónimo'}\nURL: ${log.url}\nUser Agent: ${log.userAgent}\nStack: ${log.stack}`)}
                          className="text-red-600 hover:text-red-900 p-1 md:p-2 rounded-full hover:bg-red-100 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Bug className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          generatedReports.length === 0 ? (
            <motion.p
              className="text-center text-gray-500 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay reportes generados para este tipo o rango.
            </motion.p>
          ) : (
            <div className="responsive-table-container">
              <table className="responsive-table divide-y divide-gray-200 w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha de Generación</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Tamaño</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatedReports.map((report) => (
                    <motion.tr
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{report.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">{report.size}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <motion.button
                          onClick={downloadReport}
                          className="text-blue-600 hover:text-blue-900 p-1 md:p-2 rounded-full hover:bg-blue-100 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Download className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Reports;