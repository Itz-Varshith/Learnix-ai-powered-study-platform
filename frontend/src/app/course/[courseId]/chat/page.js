'use client';

import { useParams } from 'next/navigation';
import ChatRoom from '@/components/tools/ChatRoom';

export default function ChatPage() {
  const params = useParams();
  return <ChatRoom courseId={params.courseId} />;
}