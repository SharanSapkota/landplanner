import { redirect } from "next/navigation";
import { ChatPane } from "@/components/chat/chat-pane";
import { findOrCreateProjectChatSession, getChatSession } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export default async function ProjectChatPage(props: PageProps<"/dashboard/[id]/chat">) {
  const { id } = await props.params;
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const session = await findOrCreateProjectChatSession(token, id);
  const { messages } = await getChatSession(token, session.id);

  return <ChatPane sessionId={session.id} initialMessages={messages} />;
}
