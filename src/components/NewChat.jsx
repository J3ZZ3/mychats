import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

const NewChat = ({ setCurrentChat }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '!=', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => doc.data());
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const startNewChat = async (otherUser) => {
    try {
      const chatData = {
        participants: [
          {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            name: auth.currentUser.displayName || 'Anonymous',
            photoURL: auth.currentUser.photoURL || '/default-avatar.jpg'
          },
          {
            uid: otherUser.uid,
            email: otherUser.email,
            name: otherUser.displayName || 'Anonymous',
            photoURL: otherUser.photoURL || '/default-avatar.jpg'
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: ''
      };

      const newChatRef = await addDoc(collection(db, 'chats'), chatData);
      
      setCurrentChat({
        id: newChatRef.id,
        ...chatData
      });

    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat');
    }
  };

  return (
    <div className="new-chat">
      <div className="new-chat-header">
        <h2>Start New Chat</h2>
        <p>Select a user to start chatting with</p>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="users-list">
          {users.length === 0 ? (
            <div className="no-users">No other users found</div>
          ) : (
            users.map((user) => (
              <div 
                key={user.uid} 
                className="user-item"
                onClick={() => startNewChat(user)}
              >
                <img 
                  src={user.photoURL || '/default-avatar.jpg'} 
                  alt={user.name || 'Anonymous'} 
                  className="user-avatar"
                  onError={(e) => {
                    e.target.src = '/default-avatar.jpg';
                  }}
                />
                <div className="user-info">
                  <h3>{user.name || 'Anonymous'}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewChat; 