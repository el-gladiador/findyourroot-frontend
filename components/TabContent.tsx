'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import TreeTab from './tabs/TreeTab';
import SettingsTab from './tabs/SettingsTab';
import AboutTab from './tabs/AboutTab';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  in: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  out: { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
};

export default function TabContent() {
  const { currentTab, settings } = useAppStore();
  const animationsEnabled = settings.animationsEnabled;

  const renderTab = () => {
    switch (currentTab) {
      case 'tree':
        return <TreeTab />;
      case 'settings':
        return <SettingsTab />;
      case 'about':
        return <AboutTab />;
      default:
        return <TreeTab />;
    }
  };

  if (!animationsEnabled) {
    return <div className="h-full w-full">{renderTab()}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTab}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="h-full w-full"
      >
        {renderTab()}
      </motion.div>
    </AnimatePresence>
  );
}
