import React from "react";
import { auth } from "../firebase";
import { formatDistanceToNow } from 'date-fns';

const Message = ({ message }) => {
  const { text, uid, name, avatar, createdAt } = message;
  const isCurrentUser = uid === auth.currentUser.uid;
  
  const timestamp = createdAt?.toDate();
  const timeAgo = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : '';

  return (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
      {!isCurrentUser && (
        <img className="message-avatar" src={avatar} alt={name} />
      )}
      <div className="message-bubble">
        {!isCurrentUser && <div className="message-name">{name}</div>}
        <div className="message-text">{text}</div>
        <div className="message-time">{timeAgo}</div>
      </div>
    </div>
  );
};

export default Message;