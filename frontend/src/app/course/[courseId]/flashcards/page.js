'use client';

import { useParams } from 'next/navigation';
import Flashcards from '@/components/tools/Flashcards';

export default function FlashcardsPage() {
  const params = useParams();
  return <Flashcards courseId={params.courseId} />;
}