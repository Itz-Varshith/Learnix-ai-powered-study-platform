'use client';

import { useParams } from 'next/navigation';
import Summarizer from '@/components/tools/Summarizer';

export default function GroupSummarizerPage() {
  const params = useParams();
  
  return <Summarizer groupId={params.groupId} />;
}

