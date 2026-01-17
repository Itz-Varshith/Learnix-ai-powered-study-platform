'use client';

import { useParams } from 'next/navigation';
import AiDoubtSolver from '@/components/tools/AiDoubtSolver';

export default function DoubtSolverPage() {
  const params = useParams();
  return <AiDoubtSolver courseId={params.courseId} />;
}