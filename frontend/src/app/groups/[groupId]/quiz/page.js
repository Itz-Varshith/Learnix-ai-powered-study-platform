'use client';

import { useParams } from 'next/navigation';
import Quiz from '@/components/tools/Quiz';

export default function GroupQuizPage() {
  const params = useParams();
  
  return <Quiz groupId={params.groupId} />;
}

