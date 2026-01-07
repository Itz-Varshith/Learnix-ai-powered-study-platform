'use client';

import { useParams } from 'next/navigation';
import AiDoubtSolver from '@/components/tools/AiDoubtSolver';

export default function GroupDoubtSolverPage() {
  const params = useParams();
  
  return <AiDoubtSolver groupId={params.groupId} />;
}

