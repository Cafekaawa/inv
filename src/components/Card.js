import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      className={`bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;