import { useEffect, useState } from "react";
import { Lightbox } from "../../shell/chat";
import type { LightboxItem, OutgoingAttachment } from "../../shell/chat";
import { dialogs } from "../../shell/dialogs";
import { Composer } from "./Composer";
import type { MessageAction } from "./MessageMenu";
import { MessageList } from "./MessageList";
import { RoomList } from "./RoomList";
import type { BackPage } from "./RoomList";
import { useGroupText } from "./text";
import { MemberInfo, ThreadHeader } from "./ThreadHeader";
import type { Credentials, Member, Message, ReplyTarget } from "./types";
import { useGroupChat } from "./useGroupChat";

type GroupChatProps = {
  credentials: Credentials;
  backHref: BackPage;
};

/* Every picture in the room, so the viewer can walk from one to the next. */
function galleryOf(messages: readonly Message[]): LightboxItem[] {
  return messages.flatMap(message =>
    message.attachment?.kind === "image"
      ? [{ url: message.attachment.url, name: message.attachment.name, from: message.fromName, time: message.time }]
      : [],
  );
}

/**
 * The full-screen group chat. Two kinds of room: an association's chairman
 * with its member companies, and the association heads together; plus direct
 * chats opened from a room's member list.
 */
export function GroupChat({ credentials, backHref }: GroupChatProps) {
  const chat = useGroupChat(credentials);
  const text = useGroupText();
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [viewerAt, setViewerAt] = useState<number | null>(null);

  const activeGroup = chat.groups.find(group => group.id === chat.activeId);
  /* A deleted message is simply gone. */
  const messages = chat.thread.filter(message => !message.isDeleted);
  const gallery = galleryOf(messages);

  useEffect(() => {
    if (menuFor === null) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".tg-menu, .tg-more")) return;
      setMenuFor(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuFor]);

  const openRoom = (groupId: string) => {
    setIsInfoOpen(false);
    chat.open(groupId);
  };

  const writeTo = (member: Member) => {
    setIsInfoOpen(false);
    chat.openDm(member);
  };

  const send = (messageText: string, attachment: OutgoingAttachment | null): Promise<boolean> => {
    const reply = replyTo;
    setReplyTo(null);
    return chat.send(messageText, attachment, reply);
  };

  const confirmDelete = async (id: string) => {
    if (await dialogs.confirm(text("del_ask"), { tone: "danger" })) chat.remove(id);
  };

  const handleAction = (message: Message, action: MessageAction) => {
    setMenuFor(null);
    if (action === "reply") {
      setReplyTo({ id: message.id, name: message.fromName, text: message.text || message.attachment?.name || "" });
    } else if (action === "edit") {
      setEditing(message);
      setReplyTo(null);
    } else {
      void confirmDelete(message.id);
    }
  };

  let emptyText: string | null = null;
  if (chat.listStatus === "ready" && chat.groups.length === 0) emptyText = text("none");
  else if (chat.activeId && chat.isThreadLoaded) emptyText = text("empty");

  return (
    <div className={chat.activeId ? "tg open" : "tg"}>
      <RoomList
        backHref={backHref}
        status={chat.listStatus}
        groups={chat.groups}
        activeId={chat.activeId}
        onOpen={openRoom}
      />
      <section className="tg-main" id="tgMain">
        <ThreadHeader group={activeGroup} onShowInfo={() => setIsInfoOpen(true)} />
        <MemberInfo
          group={activeGroup}
          me={chat.me}
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          onWrite={writeTo}
        />
        <MessageList
          messages={messages}
          me={chat.me}
          emptyText={emptyText}
          menuFor={menuFor}
          typingWho={chat.typingWho}
          notes={chat.notes}
          onCloseMenu={() => setMenuFor(null)}
          onToggleMenu={id => setMenuFor(current => (current === id ? null : id))}
          onReact={(id, emoji) => {
            setMenuFor(null);
            chat.react(id, emoji);
          }}
          onAction={handleAction}
          onOpenImage={url => setViewerAt(Math.max(0, gallery.findIndex(item => item.url === url)))}
        />
        <Composer
          replyTo={replyTo}
          editing={editing}
          onSend={send}
          onEdit={chat.edit}
          onCancelEdit={() => setEditing(null)}
          onClearReply={() => setReplyTo(null)}
          onTyping={chat.notifyTyping}
          addNote={chat.addNote}
        />
      </section>
      <Lightbox items={gallery} openAt={viewerAt} onClose={() => setViewerAt(null)} />
    </div>
  );
}
