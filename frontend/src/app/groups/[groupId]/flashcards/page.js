'use client';

import { useParams } from 'next/navigation';
import Flashcards from '@/components/tools/Flashcards';

export default function GroupFlashcardsPage() {
  const params = useParams();
  
  return <Flashcards groupId={params.groupId} />;
}

