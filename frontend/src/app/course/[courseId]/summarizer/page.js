'use client';

import { useParams } from 'next/navigation';
import Summarizer from '@/components/tools/Summarizer';

export default function SummarizerPage() {
  const params = useParams();
  return <Summarizer courseId={params.courseId} />;
}