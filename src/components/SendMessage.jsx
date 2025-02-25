import React, { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

const SendMessage = ({ chatId }) => {
  const [message, setMessage] = useState("");

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

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
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
            onChange={(e) => setMessage(e.target.value)}
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