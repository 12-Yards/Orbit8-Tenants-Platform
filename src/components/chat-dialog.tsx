"use client";

import Link from "@/components/tenant-link";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGetUserProfileByIdQuery, useGetMessagesQuery, useSendMessageMutation } from "@/store/api";

type Message = {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type UserProfile = {
  id: string;
  mumblesVibeName: string;
  profileImageUrl: string | null;
};

interface ChatDialogProps {
  recipientId: string | null;
  onClose: () => void;
}

export function ChatDialog({ recipientId, onClose }: ChatDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: recipient } = useGetUserProfileByIdQuery(recipientId!, { skip: !recipientId });

  const { data: messages, isLoading } = useGetMessagesQuery(
    { recipientId: recipientId! },
    { skip: !recipientId || !isAuthenticated, pollingInterval: 5000 }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage({ recipientId: recipientId!, body: { content: newMessage.trim() } })
        .unwrap()
        .then(() => {
          setNewMessage("");
        });
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  return (
    <Dialog open={!!recipientId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 h-[80vh] max-h-[600px] flex flex-col">
        <DialogHeader className="bg-primary/5 border-b px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link href={`/user/${recipientId}`} onClick={onClose}>
              <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <AvatarImage src={recipient?.profileImageUrl || undefined} alt={recipient?.mumblesVibeName} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {recipient?.mumblesVibeName ? getInitials(recipient.mumblesVibeName) : "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <DialogTitle className="text-base">
                <Link href={`/user/${recipientId}`} onClick={onClose} className="hover:underline">
                  {recipient?.mumblesVibeName || "Loading..."}
                </Link>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div 
          ref={messagesContainerRef} 
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/50 animate-pulse" />
                <p className="text-muted-foreground text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg: Message, index: number) => {
              const isOwn = msg.senderId === user?.id;
              const showDate = index === 0 || 
                new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
              
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge variant="outline" className="text-xs font-normal bg-background">
                        {new Date(msg.createdAt).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </Badge>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 shadow-sm ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-card border rounded-2xl rounded-bl-md"
                      }`}
                    >
                      <p className="break-words text-[15px] leading-relaxed">{msg.content}</p>
                      <p className={`text-[11px] mt-1.5 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Say hello to {recipient?.mumblesVibeName || "your connection"}!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 shrink-0 bg-background">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full px-4"
              data-testid="input-message"
              disabled={isSending}
            />
            <Button 
              type="submit" 
              size="icon"
              className="rounded-full shrink-0"
              disabled={!newMessage.trim() || isSending}
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
