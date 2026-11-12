import { redirect } from 'next/navigation';
import { resolveAppUser } from '@/lib/auth-utils';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const session = await resolveAppUser();

  if (!session) {
    redirect('/login');
  }

  return <OnboardingClient />;
}
