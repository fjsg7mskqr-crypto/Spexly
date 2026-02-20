'use client';

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
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
        transition={{ type: 'spring', stiffness: 80, damping: 15, delay }}
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
      viewport={{ once: true, margin: '-50px' }}
      variants={fadeUp}
      transition={{ type: 'spring', stiffness: 80, damping: 15, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
