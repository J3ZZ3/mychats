import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, getDoc, doc, setDoc, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ setCurrentChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [restoringChats, setRestoringChats] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chats, setChats] = useState([]);
  
  // Query for active chats
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
  
  const [chatsData, loading] = useCollectionData(q, { idField: 'id' });

  // Restore previous chats on component mount
  useEffect(() => {
    const restorePreviousChats = async () => {
      setRestoringChats(true);
      try {
        // Get user's chat references
        const userChatsRef = collection(db, 'users', auth.currentUser.uid, 'chats');
        const userChatsSnapshot = await getDocs(userChatsRef);
        
        // Get full chat documents
        const chatPromises = userChatsSnapshot.docs.map(async (doc) => {
          const chatRef = doc(db, 'chats', doc.id);
          const chatDoc = await getDoc(chatRef);
          return { id: chatDoc.id, ...chatDoc.data() };
        });
        
        const chats = await Promise.all(chatPromises);
        setChats(chats);
      } catch (error) {
        console.error('Error restoring chats:', error);
      } finally {
        setRestoringChats(false);
      }
    };

    restorePreviousChats();
  }, []);

  // Load all users when showing all users view
  useEffect(() => {
    const fetchAllUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '!=', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (showAllUsers) {
      fetchAllUsers();
    }
  }, [showAllUsers]);

  // Add user online status tracking
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const onlineStatus = {};
      snapshot.docs.forEach((doc) => {
        onlineStatus[doc.id] = doc.data().isOnline;
      });
      setOnlineUsers(onlineStatus);
    });

    return () => unsubscribe();
  }, []);

  // Add unread message tracking
  useEffect(() => {
    const unreadRef = collection(db, 'users', auth.currentUser.uid, 'unread');
    const unsubscribe = onSnapshot(unreadRef, (snapshot) => {
      const counts = {};
      snapshot.docs.forEach((doc) => {
        counts[doc.id] = doc.data().count;
      });
      setUnreadCounts(counts);
    });

    return () => unsubscribe();
  }, []);

  // Modified function to handle starting a new chat with a user
  const startNewChat = async (otherUser) => {
    try {
      // Check if a chat already exists with this user
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          name: auth.currentUser.displayName || 'Anonymous',
          photoURL: auth.currentUser.photoURL || '/default-avatar.jpg'
        })
      );

      const querySnapshot = await getDocs(existingChatQuery);
      const existingChat = querySnapshot.docs.find(doc => 
        doc.data().participants.some(p => p.uid === otherUser.uid)
      );

      if (existingChat) {
        // If chat exists, use it
        const chatData = { id: existingChat.id, ...existingChat.data() };
        await handleChatSelect(chatData);
        return;
      }

      // If no chat exists, create a new one
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
      const newChat = { id: newChatRef.id, ...chatData };
      
      // Save to user's chats collection
      await handleChatSelect(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Modified user selection handler
  const handleUserSelect = (user) => {
    startNewChat(user);
  };

  // Save chat to user's chats collection when selected
  const handleChatSelect = async (chat) => {
    try {
      // Save chat reference to user's chats collection
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'chats', chat.id), {
        lastAccessed: new Date(),
        participants: chat.participants
      });

      setCurrentChat(chat);
    } catch (error) {
      console.error('Error saving chat reference:', error);
      setCurrentChat(chat);
    }
  };

  const filteredItems = showAllUsers 
    ? allUsers.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : chatsData?.filter(chat => {
        const otherParticipant = chat.participants.find(p => p.uid !== auth.currentUser.uid);
        return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               otherParticipant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      });

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>{showAllUsers ? 'All Users' : 'Messages'}</h2>
        <div className="chat-list-actions">
          <button 
            onClick={() => setShowAllUsers(!showAllUsers)} 
            className="toggle-view-btn"
          >
            {showAllUsers ? 'Show Chats' : 'Show Users'}
          </button>
          {!showAllUsers && (
            <button onClick={() => setCurrentChat(null)} className="new-chat-btn">
              New Chat
            </button>
          )}
        </div>
      </div>

      <div className="chat-list-search">
        <input
          type="text"
          placeholder={showAllUsers ? "Search users..." : "Search conversations..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="chat-search-input"
        />
      </div>

      <div className="chat-list-items">
        {(loading || loadingUsers || restoringChats) ? (
          <div className="loading">Loading...</div>
        ) : filteredItems?.length === 0 ? (
          <div className="no-chats">
            {searchTerm ? 'No matches found' : (showAllUsers ? 'No other users' : 'No conversations yet')}
          </div>
        ) : (
          <>
            {filteredItems?.map((item) => {
              if (showAllUsers) {
                return (
                  <div 
                    key={item.uid} 
                    className="chat-list-item"
                    onClick={() => handleUserSelect(item)}
                  >
                    <img 
                      src={item.photoURL || '/default-avatar.jpg'} 
                      alt="Profile" 
                      className="chat-list-avatar"
                      onError={(e) => {
                        e.target.src = '/default-avatar.jpg';
                      }}
                    />
                    <div className="chat-list-info">
                      <div className="chat-list-header-info">
                        <h3>{item.displayName || 'Anonymous'}</h3>
                        <div className="user-status">
                          <span className={`status-dot ${onlineUsers[item.uid] ? 'online' : 'offline'}`} />
                          {onlineUsers[item.uid] ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      <p className="chat-preview">{item.email}</p>
                    </div>
                  </div>
                );
              } else {
                const otherParticipant = item.participants.find(
                  p => p.uid !== auth.currentUser.uid
                );
                
                const timeAgo = item.updatedAt?.toDate ? 
                  formatDistanceToNow(item.updatedAt.toDate(), { addSuffix: true }) : 
                  '';

                const hasDraft = item.drafts?.[auth.currentUser.uid]?.text;
                
                return (
                  <div 
                    key={item.id} 
                    className={`chat-list-item ${hasDraft ? 'has-draft' : ''}`}
                    onClick={() => handleChatSelect(item)}
                  >
                    <img 
                      src={otherParticipant?.photoURL || '/default-avatar.jpg'} 
                      alt="Profile" 
                      className="chat-list-avatar"
                      onError={(e) => {
                        e.target.src = '/default-avatar.jpg';
                      }}
                    />
                    <div className="chat-list-info">
                      <div className="chat-list-header-info">
                        <h3>{otherParticipant?.name || 'Anonymous'}</h3>
                        <span className="chat-time">{timeAgo}</span>
                        <div className="user-status">
                          <span className={`status-dot ${onlineUsers[otherParticipant?.uid] ? 'online' : 'offline'}`} />
                          {onlineUsers[otherParticipant?.uid] ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      <p className="chat-preview">
                        {hasDraft ? '📝 Draft: ' + hasDraft : item.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unreadCounts[item.id] > 0 && (
                      <div className="unread-badge">{unreadCounts[item.id]}</div>
                    )}
                  </div>
                );
              }
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList; 