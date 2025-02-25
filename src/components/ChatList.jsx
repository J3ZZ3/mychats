import React from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const ChatList = ({ setCurrentChat }) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', {
      uid: auth.currentUser.uid
    })
  );
  
  const [chats, loading] = useCollectionData(q, { idField: 'id' });

  console.log("Current user:", auth.currentUser.email);
  console.log("Fetched chats:", chats);

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <button onClick={() => setCurrentChat(null)} className="new-chat-btn">
          New Chat
        </button>
      </div>

      <div className="chat-list-items">
        {loading ? (
          <div className="loading">Loading chats...</div>
        ) : chats?.length === 0 ? (
          <div className="no-chats">No chats yet</div>
        ) : (
          chats?.map((chat) => {
            const otherParticipant = chat.participants.find(
              p => p.uid !== auth.currentUser.uid
            );
            
            return (
              <div 
                key={chat.id} 
                className="chat-list-item"
                onClick={() => setCurrentChat(chat)}
              >
                <img 
                  src={otherParticipant?.photoURL || '/default-avatar.jpg'} 
                  alt="Profile" 
                  className="chat-list-avatar"
                />
                <div className="chat-list-info">
                  <h3>{otherParticipant?.name || 'Anonymous'}</h3>
                  <p>{chat.lastMessage || 'No messages yet'}</p>
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