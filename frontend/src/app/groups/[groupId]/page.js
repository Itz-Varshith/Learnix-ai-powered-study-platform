'use client';

import { useParams } from 'next/navigation';
import Resources from '@/components/tools/Resources';

export default function GroupResourcesPage() {
  const params = useParams();
  
  // Pass groupId as courseId - the backend uses the same endpoints
  return <Resources courseId={params.groupId} />;
}

