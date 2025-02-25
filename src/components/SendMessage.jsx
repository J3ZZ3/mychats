import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

const SendMessage = ({ chatId }) => {
  const [message, setMessage] = useState("");
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  // Auto-save functionality
  useEffect(() => {
    // Clear previous timer on unmount
    return () => {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
    };
  }, []);

  const startAutoSave = () => {
    // Clear any existing timer
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    
    // Create new timer that saves every 10 seconds
    const timer = setInterval(async () => {
      if (message.trim()) {
        try {
          const draftRef = doc(db, 'chats', chatId, 'drafts', auth.currentUser.uid);
          await updateDoc(draftRef, {
            text: message.trim(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error("Error saving draft:", error);
        }
      }
    }, 10000); // 10 seconds

    setAutoSaveTimer(timer);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    
    if (!chatId || message.trim() === "") return;

    try {
      const messageData = {
        text: message.trim(),
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Anonymous',
        avatar: auth.currentUser.photoURL || '',
        createdAt: serverTimestamp()
      };

      // Add message to subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, messageData);

      // Update chat's lastMessage and updatedAt
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: message.trim(),
        updatedAt: serverTimestamp()
      });

      // Clear the draft after sending
      const draftRef = doc(db, 'chats', chatId, 'drafts', auth.currentUser.uid);
      await updateDoc(draftRef, {
        text: '',
        updatedAt: serverTimestamp()
      });

      // Clear the input field
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Start auto-save when typing begins
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!autoSaveTimer) {
      startAutoSave();
    }
  };

  return (
    <div className="send-message">
      <form onSubmit={sendMessage}>
        <div className="message-input-container">
          <input
            type="text"
            className="form-input__input"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            style={{ color: 'var(--text-primary)' }}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!chatId || message.trim() === ""}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendMessage;