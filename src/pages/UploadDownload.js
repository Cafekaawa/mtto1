import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, Users, Coffee, Wrench, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import logError from '../utils/logError';

const UploadDownload = ({ showNotification }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState(''); // 'clients', 'equipment', 'services'

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadType) {
      showNotification('Por favor, selecciona un tipo de carga y un archivo CSV.', 'warning');
      return;
    }

    showNotification(`Cargando archivo para ${uploadType}... (Funcionalidad de procesamiento no implementada)`, 'info');
    
    // --- Lógica de procesamiento y subida a Firestore (NO IMPLEMENTADA AQUÍ DIRECTAMENTE) ---
    // Esta parte es compleja y requiere:
    // 1. Leer el archivo CSV (usar una librería como PapaParse)
    // 2. Validar cada fila del CSV contra el esquema de tu Firestore
    // 3. Manejar errores de validación (ej. datos faltantes, tipos incorrectos)
    // 4. Decidir si es una inserción nueva o una actualización (basado en IDs)
    // 5. Realizar operaciones por lotes (batch writes) para eficiencia en Firestore
    // 6. Idealmente, esta lógica se haría en una Firebase Cloud Function para seguridad y escalabilidad.

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      console.log("CSV Content:", text);
      // Aquí iría la lógica para parsear el CSV y subir a Firestore
      // Ejemplo: PapaParse.parse(text, { header: true, complete: (results) => { console.log(results.data); /* ... */ } });
      showNotification(`Archivo ${selectedFile.name} cargado. Procesamiento pendiente.`, 'success');
      setSelectedFile(null);
      setUploadType('');
    };
    reader.onerror = (error) => {
      showNotification('Error al leer el archivo.', 'error');
      logError(error, 'UploadDownload - handleUpload - FileReader');
    };
    reader.readAsText(selectedFile);
  };

  const generateCsv = (data, headers, filename) => {
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add header row

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] !== undefined ? row[header] : '';
        // Escape commas and double quotes
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(`Plantilla ${filename} descargada con éxito.`, 'success');
    } else {
      showNotification('Tu navegador no soporta la descarga automática de archivos.', 'warning');
    }
  };

  const handleDownloadTemplate = async (type) => {
    let headers = [];
    let exampleData = [];
    let filename = `plantilla_${type}.csv`;

    try {
      if (type === 'clients') {
        headers = ['id', 'name', 'contact', 'phone', 'email', 'address', 'isActive'];
        // Fetch existing data to include in template
        const snapshot = await getDocs(collection(db, "clients"));
        exampleData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        if (exampleData.length === 0) {
          exampleData = [{ id: 'ejemplo_id_cliente_1', name: 'Cafetería El Grano', contact: 'Juan Pérez', phone: '5512345678', email: 'juan@elgrano.com', address: 'Calle Falsa 123', isActive: true }];
        }
      } else if (type === 'equipment') {
        headers = ['id', 'type', 'brand', 'model', 'serial', 'purchaseDate', 'invoiceNumber', 'currentCondition', 'currentStatus', 'status', 'client', 'lastService', 'lastServiceType', 'isNewInstallation', 'installationDate'];
        const snapshot = await getDocs(collection(db, "equipment"));
        exampleData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        if (exampleData.length === 0) {
          exampleData = [{ id: 'ejemplo_id_equipo_1', type: 'Cafetera', brand: 'La Marzocco', model: 'Linea Mini', serial: 'LM001', purchaseDate: '2023-01-15', invoiceNumber: 'INV001', currentCondition: 'Excelente', currentStatus: 'Nuevo', status: 'disponible', client: 'ejemplo_id_cliente_1', lastService: '', lastServiceType: '', isNewInstallation: true, installationDate: '2023-01-20' }];
        }
      } else if (type === 'services') {
        headers = ['id', 'folio', 'clientId', 'equipmentId', 'type', 'machineType', 'dateStart', 'dateEnd', 'status', 'checklist', 'partsUsed', 'description', 'nextServiceComments', 'technician'];
        const snapshot = await getDocs(collection(db, "services"));
        exampleData = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          // Convert complex objects/arrays to JSON strings for CSV
          checklist: JSON.stringify(doc.data().checklist || {}),
          partsUsed: JSON.stringify(doc.data().partsUsed || []),
        }));
        if (exampleData.length === 0) {
          exampleData = [{ id: 'ejemplo_id_servicio_1', folio: '000000000001', clientId: 'ejemplo_id_cliente_1', equipmentId: 'ejemplo_id_equipo_1', type: 'Mantenimiento Preventivo', machineType: 'Cafetera', dateStart: '2024-03-10', dateEnd: '2024-03-10', status: 'Completado', checklist: '{"Limpieza de duchas":true}', partsUsed: '[{"quantity":1,"description":"Empaque de grupo","price":5.00,"included":true}]', description: 'Mantenimiento preventivo rutinario', nextServiceComments: 'Revisar presión en 6 meses', technician: 'Carlos Hernandez Valencia' }];
        }
      } else {
        showNotification('Tipo de plantilla no reconocido.', 'error');
        return;
      }
      generateCsv(exampleData, headers, filename);
    } catch (error) {
      showNotification('Error al generar la plantilla CSV.', 'error');
      logError(error, `UploadDownload - handleDownloadTemplate - ${type}`);
    }
  };

  return (
    <motion.div
      className="p-4 md:p-8 bg-gray-50 min-h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <FileText className="w-8 h-8 text-amber-600" />
          Gestión de Cargas y Descargas
        </h2>

        <p className="text-gray-700 mb-8">
          Aquí podrás gestionar la importación y exportación de datos del sistema utilizando plantillas CSV.
          Esta sección está diseñada para administradores para mantener la integridad y el respaldo de la información.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sección de Carga */}
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center text-center shadow-sm"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            transition={{ duration: 0.3 }}
          >
            <Upload className="w-16 h-16 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-3">Cargar Datos (CSV)</h3>
            <p className="text-blue-700 mb-5">Importa nuevos registros o actualiza existentes desde un archivo CSV.</p>
            
            <div className="w-full mb-4">
              <label htmlFor="uploadType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Datos a Cargar</label>
              <select
                id="uploadType"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <option value="">Selecciona tipo...</option>
                <option value="clients">Clientes</option>
                <option value="equipment">Equipos</option>
                <option value="services">Servicios</option>
              </select>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 mb-4"
            />
            {selectedFile && <p className="text-sm text-gray-600 mb-4">Archivo seleccionado: {selectedFile.name}</p>}

            <motion.button
              onClick={handleUpload}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!selectedFile || !uploadType}
            >
              <Upload className="w-5 h-5" />
              Cargar Archivo
            </motion.button>
            <p className="text-xs text-gray-500 mt-3 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-1 text-blue-500" />
              La carga procesará los datos, pero la subida a Firestore requiere validación y lógica avanzada.
            </p>
          </motion.div>

          {/* Sección de Descarga */}
          <motion.div
            className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center shadow-sm"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            transition={{ duration: 0.3 }}
          >
            <Download className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-3">Descargar Plantillas (CSV)</h3>
            <p className="text-green-700 mb-5">Exporta plantillas CSV con datos existentes para facilitar la carga masiva o el respaldo.</p>
            
            <div className="grid grid-cols-1 gap-3 w-full">
              <motion.button
                onClick={() => handleDownloadTemplate('clients')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="w-5 h-5" />
                Plantilla Clientes
              </motion.button>
              <motion.button
                onClick={() => handleDownloadTemplate('equipment')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Coffee className="w-5 h-5" />
                Plantilla Equipos
              </motion.button>
              <motion.button
                onClick={() => handleDownloadTemplate('services')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wrench className="w-5 h-5" />
                Plantilla Servicios
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadDownload;