'use client';

import { useParams } from 'next/navigation';
import ChatRoom from '@/components/tools/ChatRoom';

export default function GroupChatPage() {
  const params = useParams();
  
  return <ChatRoom groupId={params.groupId} />;
}

