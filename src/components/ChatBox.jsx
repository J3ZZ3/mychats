import React, { useEffect, useRef } from "react";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Message from "./Message";
import SendMessage from "./SendMessage";

const ChatBox = ({ chatId, chat }) => {
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("createdAt"), limit(50));
  const [messages] = useCollectionData(q, { idField: 'id' });
  const bottomRef = useRef();

  // Find the other participant in the chat
  const otherParticipant = chat?.participants?.find(
    p => p.uid !== auth.currentUser.uid
  );

  // Get the display name (prefer name over email)
  const displayName = otherParticipant?.name || otherParticipant?.email || 'Chat';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-box">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>{displayName}</h2>
          <span className="chat-status">Active now</span>
        </div>
      </div>
      
      <div className="messages-wrapper">
        <div className="messages-container">
          {messages && messages.map((msg) => (
            <Message 
              key={msg.id || `${msg.createdAt}-${msg.uid}`} 
              message={msg} 
            />
          ))}
          <div ref={bottomRef}></div>
        </div>
      </div>
      
      <SendMessage chatId={chatId} />
    </div>
  );
};

export default ChatBox;