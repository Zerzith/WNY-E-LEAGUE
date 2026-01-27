import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Smile } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  text: string;
  displayName: string;
  userId: string;
  timestamp: any;
}

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "live_chat"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)).reverse();
      setMessages(msgs);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "live_chat"), {
        text: newMessage,
        displayName: user.displayName || "Anonymous",
        userId: user.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
      setShowEmoji(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl text-white mb-4">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</h2>
        <Button onClick={() => setLocation("/login")}>ไปที่หน้าเข้าสู่ระบบ</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
      <Card className="flex-1 bg-card/50 border-white/10 backdrop-blur-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h2 className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            Live Chat Room
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.userId === user.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-secondary text-white rounded-bl-none'
                }`}>
                  <div className="text-xs opacity-50 mb-1">{msg.displayName}</div>
                  <div className="break-words">{msg.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/20 relative">
          {showEmoji && (
            <div className="absolute bottom-20 left-4 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={300} height={400} />
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowEmoji(!showEmoji)}
              className="text-muted-foreground hover:text-accent"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="bg-background/50 border-white/10"
            />
            <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
