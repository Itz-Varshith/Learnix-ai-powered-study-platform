'use client';

import { useParams } from 'next/navigation';
import Quiz from '@/components/tools/Quiz';

export default function QuizPage() {
  const params = useParams();
  return <Quiz courseId={params.courseId} />;
}