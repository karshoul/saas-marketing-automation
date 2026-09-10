import React from "react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full h-screen overflow-hidden bg-[#020617]"
    >
      <iframe
        src="/landing-pages/verdio.html"
        title="VERDIO 3D Engine"
        className="w-full h-full border-0 absolute inset-0 z-0"
      />
    </motion.div>
  );
}