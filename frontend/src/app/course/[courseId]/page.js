'use client';

import { useParams } from 'next/navigation';
import Resources from '@/components/tools/Resources';

export default function ResourcesPage() {
  const params = useParams();
  
  // Pass courseId so the component knows which course's resources to load
  return <Resources courseId={params.courseId} />;
}