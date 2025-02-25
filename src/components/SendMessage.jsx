import React, { useState, useRef } from "react";
import { auth, db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const SendMessage = ({ chatId }) => {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "" && !fileInputRef.current?.files?.length) return;

    const attachments = [];
    if (fileInputRef.current?.files?.length) {
      setIsUploading(true);
      for (const file of fileInputRef.current.files) {
        const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        attachments.push({
          url,
          type: file.type,
          name: file.name
        });
      }
      setIsUploading(false);
      fileInputRef.current.value = '';
    }

    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: message.trim(),
      createdAt: serverTimestamp(),
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName,
      avatar: auth.currentUser.photoURL,
      attachments
    });

    setMessage("");
  };

  return (
    <div className="send-message">
      <form onSubmit={handleSubmit} className="message-input-container">
        <button 
          type="button" 
          className="attachment-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          className="file-input"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          style={{ display: 'none' }}
        />
        <div className="message-input-wrapper">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
          />
        </div>
        <button 
          type="submit" 
          className="send-button"
          disabled={isUploading || (message.trim() === "" && !fileInputRef.current?.files?.length)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default SendMessage;