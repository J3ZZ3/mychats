import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import './App.css';
import NavBar from './components/Navbar';
import ChatBox from './components/ChatBox';
import ChatList from './components/ChatList';
import NewChat from './components/NewChat';
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
        <div className="chat-container">
          <ChatList setCurrentChat={setCurrentChat} />
          {currentChat ? (
            <ChatBox chatId={currentChat.id} chat={currentChat} />
          ) : (
            <NewChat setCurrentChat={setCurrentChat} />
          )}
        </div>
      )}
    </div>
  );
};

export default App;