import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import './App.css';
import NavBar from './components/Navbar';
import ChatBox from './components/ChatBox';
import ChatList from './components/ChatList';
import UsersList from './components/UsersList';
import Welcome from './components/Welcome';
import { setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const App = () => {
  const [user] = useAuthState(auth);
  const [currentChat, setCurrentChat] = useState(null);

  const createUserDocument = async (user) => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        createdAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  useEffect(() => {
    if (user) {
      createUserDocument(user);
    }
  }, [user]);

  return (
    <div className="App">
      <NavBar />
      {!user ? (
        <Welcome />
      ) : (
        <div className="app-container">
          <div className="sidebars-container">
            <aside className="users-sidebar">
              <UsersList setCurrentChat={setCurrentChat} />
            </aside>
            <aside className="chats-sidebar">
              <ChatList setCurrentChat={setCurrentChat} currentChat={currentChat} />
            </aside>
          </div>
          
          <main className="chat-main">
            {currentChat ? (
              <ChatBox chatId={currentChat.id} chat={currentChat} />
            ) : (
              <div className="select-chat-prompt">
                <h2>Select a user to start chatting</h2>
                <p>Choose from the list of users on the left</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default App;