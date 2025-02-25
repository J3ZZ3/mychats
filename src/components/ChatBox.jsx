import React, { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, limit, doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Message from "./Message";
import SendMessage from "./SendMessage";

const ChatBox = ({ chatId, chat }) => {
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("createdAt"), limit(50));
  const [messages] = useCollectionData(q, { idField: 'id' });
  const bottomRef = useRef();
  const [isTyping, setIsTyping] = useState({});

  // Find the other participant in the chat
  const otherParticipant = chat?.participants?.find(
    p => p.uid !== auth.currentUser.uid
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const typingRef = doc(db, 'chats', chatId, 'typing', auth.currentUser.uid);
    const unsubscribe = onSnapshot(typingRef, (doc) => {
      setIsTyping(doc.data() || {});
    });

    return () => unsubscribe();
  }, [chatId]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="user-avatar-wrapper">
            <img 
              src={otherParticipant?.photoURL || '/default-avatar.jpg'} 
              alt="Profile" 
              className="chat-header-avatar"
            />
            <span className={`status-indicator ${isTyping[otherParticipant?.uid] ? 'typing' : 'online'}`} />
          </div>
          <div className="chat-header-info">
            <h2>{otherParticipant?.name || 'Anonymous'}</h2>
            <span className="chat-status">
              {isTyping[otherParticipant?.uid] ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-button" title="Search">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
            </svg>
          </button>
          <button className="icon-button" title="Voice call">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02c-.37-1.11-.56-2.3-.56-3.53c0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
          </button>
          <button className="icon-button" title="Video call">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </button>
          <button className="icon-button" title="More options">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="messages-container">
        <div className="messages-wrapper">
          <div className="chat-date-separator">
            <span>Today</span>
          </div>
          {messages && messages.map((msg, idx) => (
            <Message 
              key={msg.id || `${msg.createdAt}-${msg.uid}`} 
              message={msg}
              showAvatar={
                idx === 0 || 
                messages[idx - 1]?.uid !== msg.uid ||
                (msg.createdAt?.seconds - messages[idx - 1]?.createdAt?.seconds > 300)
              }
            />
          ))}
          {isTyping[otherParticipant?.uid] && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>
      </div>
      
      <SendMessage chatId={chatId} />
    </div>
  );
};

export default ChatBox;