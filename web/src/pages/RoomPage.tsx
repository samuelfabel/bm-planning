import { MainLayout } from '@/components/layout/MainLayout';
import { VotingBoard } from '@/components/voting/VotingBoard';
import { usePlanning, useDemoQueue } from '@/context/PlanningContext';
import { useEffect } from 'react';

export function RoomPage() {
  const { session, createSession } = usePlanning();
  const demoQueue = useDemoQueue();

  useEffect(() => {
    if (!session) {
      createSession('Demo — Sprint Planning', demoQueue);
    }
  }, [session, createSession, demoQueue]);

  return (
    <MainLayout>
      <VotingBoard />
    </MainLayout>
  );
}
