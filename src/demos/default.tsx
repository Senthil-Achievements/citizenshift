/* src/demos/default.tsx */
import type React from 'react';
import { UnderlineAnimation } from '@/components/ui/draw-random-underline';

const DemoPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UnderlineAnimation />
    </div>
  );
};

export default DemoPage;
