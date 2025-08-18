import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const users = [
    { username: 'admin', password: 'Claudio1976+', role: 'administrador', fullName: 'Administrador Kaawa' },
    { username: 'miguel', password: 'Jesus%2019', role: 'administrador', fullName: 'Jose Miguel Fernandez Perez' },
    { username: 'carlos', password: 'robusta25', role: 'tecnico', fullName: 'Carlos Hernandez Valencia' },
    { username: 'jonathan', password: 'arabica25', role: 'administrador', fullName: 'Jonathan Valencia Quintal' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Usuario o contraseña incorrectos. ¿Olvidaste tu cafeina?');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-md border border-gray-200"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          >
            <LogIn className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-gray-800 bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
            Sistema de Acceso a Café Kaawa
          </h1>
          <p className="text-gray-500 mt-2">Inicia sesión para continuar tus mantenimientos pendientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="username"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-800 placeholder-gray-400"
                placeholder="Ingresa Tu Usuario Asignado"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                id="password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-800 placeholder-gray-400"
                placeholder="Ingresa Tu Contraseña Asignada"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <motion.p
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="w-5 h-5" />
            Iniciar Sesión
          </motion.button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          ¿Problemas para iniciar sesión? Contacta a tu administrador o al E-mail sistemas@cafekaawa.mx
        </p>
      </motion.div>
    </div>
  );
};

export default Login;