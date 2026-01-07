'use client';

import { useParams } from 'next/navigation';
import GroupMembers from '@/components/tools/GroupMembers';

export default function GroupMembersPage() {
  const params = useParams();
  
  return <GroupMembers groupId={params.groupId} />;
}

