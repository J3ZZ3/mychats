import React from "react";
import { auth } from "../firebase";
import { formatDistanceToNow } from 'date-fns';

const Message = ({ message, showAvatar }) => {
  const { text, uid, name, avatar, createdAt, attachments } = message;
  const isCurrentUser = uid === auth.currentUser.uid;
  
  const timestamp = createdAt?.toDate();
  const timeAgo = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : '';

  return (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
      {!isCurrentUser && showAvatar && (
        <div className="message-avatar-wrapper">
          <img className="message-avatar" src={avatar} alt={name} />
        </div>
      )}
      <div className="message-content-wrapper">
        {!isCurrentUser && showAvatar && (
          <div className="message-name">{name}</div>
        )}
        <div className="message-content">
          {text}
          {attachments && attachments.map((attachment, index) => (
            <div key={index} className="message-attachment">
              {attachment.type.startsWith('image/') ? (
                <img src={attachment.url} alt="attachment" />
              ) : (
                <div className="file-attachment">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  </svg>
                  <span>{attachment.name}</span>
                </div>
              )}
            </div>
          ))}
          <div className="message-meta">
            <span className="message-time">{timeAgo}</span>
            {isCurrentUser && (
              <span className="message-status">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;