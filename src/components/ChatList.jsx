import React, { useState } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ setCurrentChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      name: auth.currentUser.displayName || 'Anonymous',
      photoURL: auth.currentUser.photoURL || '/default-avatar.jpg'
    }),
    orderBy('updatedAt', 'desc')
  );
  
  const [chats, loading] = useCollectionData(q, { idField: 'id' });

  const filteredChats = chats?.filter(chat => {
    const otherParticipant = chat.participants.find(p => p.uid !== auth.currentUser.uid);
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherParticipant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <button onClick={() => setCurrentChat(null)} className="new-chat-btn">
          New Chat
        </button>
      </div>

      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="chat-search-input"
        />
      </div>

      <div className="chat-list-items">
        {loading ? (
          <div className="loading">Loading chats...</div>
        ) : filteredChats?.length === 0 ? (
          <div className="no-chats">
            {searchTerm ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          filteredChats?.map((chat) => {
            const otherParticipant = chat.participants.find(
              p => p.uid !== auth.currentUser.uid
            );
            
            const timeAgo = chat.updatedAt?.toDate ? 
              formatDistanceToNow(chat.updatedAt.toDate(), { addSuffix: true }) : 
              '';

            // Check if there's a draft
            const hasDraft = chat.drafts?.[auth.currentUser.uid]?.text;
            
            return (
              <div 
                key={chat.id} 
                className={`chat-list-item ${hasDraft ? 'has-draft' : ''}`}
                onClick={() => setCurrentChat(chat)}
              >
                <img 
                  src={otherParticipant?.photoURL || '/default-avatar.jpg'} 
                  alt="Profile" 
                  className="chat-list-avatar"
                />
                <div className="chat-list-info">
                  <div className="chat-list-header-info">
                    <h3>{otherParticipant?.name || 'Anonymous'}</h3>
                    <span className="chat-time">{timeAgo}</span>
                  </div>
                  <p className="chat-preview">
                    {hasDraft ? '📝 Draft: ' + hasDraft : chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList; 