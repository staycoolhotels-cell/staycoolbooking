'use client';

import { motion } from 'framer-motion';
import AdminPanelInteractive from './AdminPanelInteractive';

export default function AdminPanelMotionWrapper({ adminData }: { adminData: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <AdminPanelInteractive adminData={adminData} />
    </motion.div>
  );
}
