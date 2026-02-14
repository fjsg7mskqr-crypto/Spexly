'use client';

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Use 'load' for hero elements that animate immediately, 'scroll' for scroll-triggered */
  trigger?: 'load' | 'scroll';
}

export function AnimatedSection({
  children,
  delay = 0,
  className,
  trigger = 'scroll',
}: AnimatedSectionProps) {
  if (trigger === 'load') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
