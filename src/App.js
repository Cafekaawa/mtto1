import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import AddEditClient from './pages/AddEditClient';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import AddEditEquipment from './pages/AddEditEquipment';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import AddEditService from './pages/AddEditService';
import Reports from './pages/Reports';
import UploadDownload from './pages/UploadDownload';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import logError from './utils/logError';

// Componente para manejar el título del Header dinámicamente
const HeaderHandler = ({ user }) => {
  const location = useLocation();
  let title = "Dashboard"; // Default title

  if (location.pathname.startsWith("/clientes/add")) {
    title = "Agregar Cliente";
  } else if (location.pathname.startsWith("/clientes/edit/")) {
    title = "Editar Cliente";
  } else if (location.pathname.startsWith("/clientes/")) {
    title = "Detalles del Cliente";
  } else if (location.pathname.startsWith("/equipos/add")) {
    title = "Agregar Equipo";
  } else if (location.pathname.startsWith("/equipos/edit/")) {
    title = "Editar Equipo";
  } else if (location.pathname.startsWith("/equipos/")) {
    title = "Detalles del Equipo";
  } else if (location.pathname.startsWith("/servicios/add")) {
    title = "Programar Servicio";
  } else if (location.pathname.startsWith("/servicios/edit/")) {
    title = "Editar Servicio";
  } else if (location.pathname.startsWith("/servicios/")) {
    title = "Detalles del Servicio";
  } else if (location.pathname.startsWith("/cargas-descargas")) {
    title = "Cargas y Descargas";
  } else {
    switch (location.pathname) {
      case "/clientes":
        title = "Gestión de Clientes";
        break;
      case "/equipos":
        title = "Gestión de Equipos";
        break;
      case "/servicios":
        title = "Programación de Servicios";
        break;
      case "/reportes":
        title = "Generación de Reportes";
        break;
      default:
        title = "Dashboard";
    }
  }
  return <Header title={title} />;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
    // Log error to Firestore
    logError(error, errorInfo.componentStack, this.props.user);
    this.props.showNotification('¡Ups! Ha ocurrido un error inesperado. Se ha registrado para su revisión.', 'error');
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div 
          className="p-8 text-center text-red-600 bg-red-50 rounded-lg shadow-md m-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4">Algo salió mal.</h2>
          <p className="mb-2">Estamos trabajando para solucionarlo. Por favor, intenta recargar la página. Si es necesario contacta al administrador.</p>
          <details className="text-sm text-red-800 mt-4 p-2 bg-red-100 rounded-md">
            <summary>Detalles del error</summary>
            <pre className="whitespace-pre-wrap break-words text-left">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </motion.div>
      );
    }
    return this.props.children;
  }
}


// Main App component
const AppContent = () => {
  const [user, setUser] = useState(null); // State to store logged-in user
  const [notification, setNotification] = useState(null); // Global state for notifications
  const navigate = useNavigate(); // For programmatic navigation

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    navigate('/'); // Redirect to dashboard after login
    showNotification(`Bienvenido, ${loggedInUser.fullName}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    // Show a thank you message after logout
    showNotification('¡Gracias por tu trabajo! Vuelve pronto.', 'success');
    navigate('/login'); // Redirect to login page after logout
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Notification disappears after 3 seconds
  };

  // Redirect to welcome/login if no user is logged in
  useEffect(() => {
    // If no user is logged in and current path is not /welcome or /login, redirect to /welcome
    if (!user && window.location.pathname !== '/welcome' && window.location.pathname !== '/login') {
      navigate('/welcome');
    }
  }, [user, navigate]);


  // Render main app layout if user is logged in
  if (user) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col">
          <HeaderHandler user={user} /> {/* Pass user to HeaderHandler */}
          <motion.main
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Global Notification Component */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 ${
                    notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {notification.type === 'success' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                  <span>{notification.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <ErrorBoundary user={user} showNotification={showNotification}>
              <Routes>
                <Route path="/" element={<Dashboard showNotification={showNotification} userRole={user.role} />} />
                
                {/* Routes accessible by administrators */}
                {user.role === 'administrador' && (
                  <>
                    <Route path="/clientes" element={<Clients showNotification={showNotification} userRole={user.role} />} />
                    <Route path="/clientes/:id" element={<ClientDetail showNotification={showNotification} />} />
                    <Route path="/clientes/add" element={<AddEditClient showNotification={showNotification} />} />
                    <Route path="/clientes/edit/:id" element={<AddEditClient showNotification={showNotification} />} />

                    <Route path="/equipos/add" element={<AddEditEquipment showNotification={showNotification} />} />
                    <Route path="/equipos/edit/:id" element={<AddEditEquipment showNotification={showNotification} />} />
                    
                    <Route path="/servicios" element={<Services showNotification={showNotification} userRole={user.role} />} />
                    <Route path="/servicios/add" element={<AddEditService showNotification={showNotification} currentUser={user} />} />
                    <Route path="/servicios/edit/:id" element={<AddEditService showNotification={showNotification} currentUser={user} />} />

                    <Route path="/cargas-descargas" element={<UploadDownload showNotification={showNotification} />} />
                  </>
                )}

                {/* Routes accessible by technicians */}
                {user.role === 'tecnico' && (
                  <>
                    {/* Technicians can view clients and add new ones */}
                    <Route path="/clientes" element={<Clients showNotification={showNotification} userRole={user.role} />} />
                    <Route path="/clientes/:id" element={<ClientDetail showNotification={showNotification} />} />
                    <Route path="/clientes/add" element={<AddEditClient showNotification={showNotification} />} />

                    {/* Technicians can view equipment and add new ones */}
                    <Route path="/equipos/add" element={<AddEditEquipment showNotification={showNotification} />} />
                    
                    {/* Technicians can view services and add new ones */}
                    <Route path="/servicios" element={<Services showNotification={showNotification} userRole={user.role} />} />
                    <Route path="/servicios/add" element={<AddEditService showNotification={showNotification} currentUser={user} />} />
                  </>
                )}

                {/* Routes accessible by both roles (view-only for technicians where management is admin-only) */}
                <Route path="/equipos" element={<Equipment showNotification={showNotification} userRole={user.role} />} />
                <Route path="/equipos/:id" element={<EquipmentDetail showNotification={showNotification} />} />
                <Route path="/servicios/:id" element={<ServiceDetail showNotification={showNotification} />} />
                <Route path="/reportes" element={<Reports showNotification={showNotification} />} />
                
                {/* Fallback for unauthorized access or non-existent routes */}
                <Route path="*" element={<NoMatch userRole={user.role} />} />
              </Routes>
            </ErrorBoundary>
          </motion.main>
        </div>
      </div>
    );
  }

  // Render Welcome/Login page if no user is logged in
  return (
    <>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        {/* Fallback for any other path when not logged in, redirects to welcome */}
        <Route path="*" element={<Welcome />} /> 
      </Routes>
      {/* Global Notification Component (visible even on login page) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Wrapper component to ensure AppContent is always within Router
const App = () => (
  <Router>
    <AppContent />
  </Router>
);

// Simple NoMatch component for unauthorized/non-existent routes
const NoMatch = ({ userRole }) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      className="p-8 text-center text-gray-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-4">¡Ups! Página no encontrada o no tienes permiso.</h2>
      <p className="mb-6">Parece que te has desviado del camino del café. Tu rol actual es: <span className="font-semibold capitalize">{userRole}</span>.</p>
      <motion.button
        onClick={() => navigate('/')}
        className="bg-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-amber-700 transition-all flex items-center gap-2 mx-auto"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Volver al Dashboard
      </motion.button>
    </motion.div>
  );
};

export default App;