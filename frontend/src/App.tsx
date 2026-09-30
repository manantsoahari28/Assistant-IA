import { useState, useEffect } from 'react';
import { Workspace } from '@/components/workspace/Workspace';
import { ChatWidget } from '@/components/widget/ChatWidget';
import { TechGearDemo } from '@/pages/TechGearDemo';

export function App() {
  const [isDemo, setIsDemo] = useState(window.location.hash === '#demo');

  useEffect(() => {
    const onHash = () => setIsDemo(window.location.hash === '#demo');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isDemo) return <TechGearDemo />;

  return (
    <div className="relative min-h-screen bg-[var(--canvas)] selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Surface B: Enterprise Counselor Operations Workspace */}
      <Workspace />

      {/* Surface A: Embedded Customer Support Chat Widget (Floating FAB) */}
      <ChatWidget userExternalId="client-demo-1" />
    </div>
  );
}

export default App;
