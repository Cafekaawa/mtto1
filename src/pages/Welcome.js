import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Coffee, Sparkles, LogIn } from 'lucide-react';

const motivationalQuotes = [
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día. ¡A darle!",
  "Cada máquina que arreglas es un café más que se disfruta. ¡Tu trabajo importa!",
  "La calidad no es un acto, es un hábito. ¡Hoy es un gran día para ser excelente!",
  "No hay atajos para ningún lugar al que valga la pena ir. ¡Sigue adelante!",
  "Tu pasión por el café y las máquinas es tu superpoder. ¡Úsalo sabiamente!",
  "El mantenimiento es el arte de prolongar la vida. ¡Eres un artista!",
  "Un buen café empieza con una buena máquina, y una buena máquina empieza contigo. ¡Eres clave!",
  "La perfección no es alcanzable, pero si perseguimos la perfección, podemos conseguir la excelencia. ¡Vamos por ello!",
  "El café de hoy es la energía de mañana. ¡A mantener esas máquinas!", // New quote
  "No dejes para mañana el café que puedes disfrutar hoy. ¡Y la máquina que puedes arreglar!", // New quote
  "La vida es como una cafetera, si no la limpias, el café sale amargo. ¡Mantén todo impecable!", // New quote
];

const Welcome = () => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(''); // State to hold the current quote

  useEffect(() => {
    // Set a random quote when the component mounts
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setCurrentQuote(motivationalQuotes[randomIndex]);
  }, []); // Empty dependency array means this runs once on mount

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4 text-center">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-2xl border border-gray-200"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6">
          <motion.div
            className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          >
            <Coffee className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-5xl font-extrabold text-gray-800 bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent leading-tight">
            ¡Bienvenido al Sistema de Mantenimiento Kaawa!
          </h1>
        </motion.div>

        <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-8 italic">
          "{currentQuote}" <Sparkles className="inline-block w-5 h-5 text-yellow-500 ml-1" />
        </motion.p>

        <motion.button
          variants={itemVariants}
          onClick={() => navigate('/login')}
          className="bg-amber-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 mx-auto"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogIn className="w-6 h-6" />
          Ingresa al Sistema
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Welcome;