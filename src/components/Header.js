import React from 'react';
import { motion } from 'framer-motion';

const Header = ({ title }) => {
  return (
    <motion.header
      className="bg-white p-4 md:p-6 shadow-sm flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
        {title}
      </h1>
      {/* Aquí podrías añadir elementos como un avatar de usuario, notificaciones, etc. */}
    </motion.header>
  );
};

export default Header;