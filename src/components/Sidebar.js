import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Coffee, Wrench, FileText, Settings, Menu, X, LogOut, UploadCloud } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Clientes', icon: Users, path: '/clientes' },
  { name: 'Equipos', icon: Coffee, path: '/equipos' },
  { name: 'Servicios', icon: Wrench, path: '/servicios' },
  { name: 'Reportes', icon: FileText, path: '/reportes' },
  { name: 'Cargas/Descargas', icon: UploadCloud, path: '/cargas-descargas', adminOnly: true }, // New item, adminOnly
];

const Sidebar = ({ user, onLogout }) => { // Receive user and onLogout props
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: "0%" },
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!user) return false; // No user, no access
    if (user.role === 'administrador') return true; // Admin sees all
    if (user.role === 'tecnico') {
      // Technicians see Dashboard, Clients, Equipment, Services, and Reports, but not adminOnly items
      return !item.adminOnly;
    }
    return false;
  });

  const handleLogoutClick = () => {
    onLogout(); // Call the passed onLogout function
    // The showNotification is now handled in App.js after logout
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 bg-gray-900 flex justify-between items-center">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
        <div className="text-xl font-bold text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Kaawa
        </div>
      </div>

      {/* Desktop Sidebar */}
      <motion.div
        className="w-64 bg-gray-900 text-white flex-col p-6 shadow-lg hidden md:flex"
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <div className="text-3xl font-bold mb-10 text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Kaawa
        </div>
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-white">{user?.fullName}</p>
          <p className="text-sm text-gray-400 capitalize">({user?.role})</p>
        </div>
        <nav className="flex-1">
          <ul className="space-y-3">
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                <Link to={item.path}>
                  <motion.div
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-700">
          <motion.button
            className="flex items-center w-full p-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogoutClick} // Call the new handler
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Cerrar Sesión</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="fixed top-0 left-0 w-64 h-full bg-gray-900 text-white flex flex-col p-6 shadow-lg"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside sidebar
            >
              <div className="text-3xl font-bold mb-10 text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Kaawa
              </div>
              <div className="mb-6 text-center">
                <p className="text-lg font-semibold text-white">{user?.fullName}</p>
                <p className="text-sm text-gray-400 capitalize">({user?.role})</p>
              </div>
              <nav className="flex-1">
                <ul className="space-y-3">
                  {filteredNavItems.map((item) => (
                    <li key={item.name}>
                      <Link to={item.path} onClick={() => setIsOpen(false)}>
                        <motion.div
                          className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                            location.pathname === item.path
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{item.name}</span>
                        </motion.div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto pt-6 border-t border-gray-700">
                <motion.button
                  className="flex items-center w-full p-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogoutClick} // Call the new handler
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Cerrar Sesión</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;