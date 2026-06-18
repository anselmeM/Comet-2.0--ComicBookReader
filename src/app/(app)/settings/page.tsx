import { SettingsPanel } from '@/components/organisms/SettingsPanel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - Comet',
  description: 'Manage your reading preferences and local cache',
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-comet-bg text-comet-text pt-20 transition-colors duration-300">
      <SettingsPanel />
    </main>
  );
}
