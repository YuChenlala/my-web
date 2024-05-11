import React, { useState, useEffect, useRef } from 'react';
import { Button, List } from '@douyinfe/semi-ui';
import './ChatBox.css'; // 导入样式文件
import { f } from 'html2pdf.js';
import userAvatar from './man.jpg';
import robotAvatar from './robot.jpg';


function ChatBox({ messages, setMessages,data }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSystemReplying, setSystemReplying] = useState(false);
  const textareaRef = useRef(null);
  const handleSendMessage = async () =>{
    if (currentMessage.trim() === ''|| isSystemReplying) {
      return;
    }

    const userMessage = {
      content: currentMessage,
      sender: 'User', // 用户消息
      timestamp: new Date().toLocaleTimeString(),
      avatar: userAvatar,
    };

    // 把用户消 ?添加到聊?? ? ?? ?
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setCurrentMessage('');
    setSystemReplying(true);
    
    let systemReply;
    let dataText = []
    // 构建请求 ?
    const text = data.map((element,index) => {
        const temp = element.data.map((item)=>{
            if (item.type !="table"){
                return item.text;
            }
        }).join('\n');
        dataText.push(temp);
        return `??${index + 1}页的内???：\n${temp}`;
    }).join("\n");
    console.log(dataText);
    const question = `${currentMessage}`
    const requestBody = {
        data: dataText,
        prompt: question,
        history: [] ,
        max_length: 10000,
        top_p: 0.8,
        temperature: 0.95,
    };
    try {
        // 发送异步???求
        const response = await fetch('https://fad3-222-212-86-164.ngrok-free.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
    
        if (response.ok) {
          // 解析返回 ? JSON 数据
            const responseData = await response.json();
            console.log(responseData)
            // 获取?? ? ?? ?
            const systemReply = {
                content: responseData.response,
                sender: 'System',
                timestamp: new Date().toLocaleTimeString(),
                avatar: robotAvatar,
            };
            setSystemReplying(false);
            // 将回复添加到聊天记录 ?
            setMessages((prevMessages) => [...prevMessages, systemReply]);
        } else {
            console.error('Failed to fetch response from the server');
        }
    } catch (error) {
        console.error('An error occurred while fetching response:', error);
    }
  };

  const messageListRef = useRef(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
  
      handleSendMessage();
  
      setCurrentMessage('');
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className="chat-container"  style={{width: "100%"}}    >
        <div className="message-list"  style={{width: "100%"}} ref={messageListRef}>
            <List>
              {messages.map((message, index) => (
                <React.Fragment key={index}>
                  <List.Item
                    className={message.sender === 'User' ? 'user-message' : 'system-message'}
                    >
                     <div className="message-content-container">
                    {message.sender === 'User' && (
                      <React.Fragment>
                        <div className="message-text">
                          <div className="message-sender">{message.sender}</div>
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">{message.timestamp}</div>
                        </div>
                        <div className="avatar-container user-avatar">
                          <img src={message.avatar} alt={`${message.sender} Avatar`} className="avatar" />
                        </div>
                      </React.Fragment>
                    )}
                    {message.sender !== 'User' && (
                      <React.Fragment>
                        <div className="avatar-container system-avatar">
                          <img src={message.avatar} alt={`${message.sender} Avatar`} className="avatar" />
                        </div>
                        <div className="message-text">
                          <div className="message-sender">{message.sender}</div>
                          <div className="message-content">
                            {message.content.split('\n').map((line, index) => (
                              <React.Fragment key={index}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="message-time">{message.timestamp}</div>
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                    </List.Item>
                    {index < messages.length - 1 && (
                      <div style={{ height: 0, backgroundColor: 'transparent', margin: 0 }}></div>
                    )}
                </React.Fragment>
              ))}
            </List>
          </div>
          <div className="input-container"
            style={{
              width: "100%",
              width:"26vw",   // ????的这里的css格式，后面再??
              margin:0
            }}
          >
          <textarea
           style={{width:"80%"}}
            ref={textareaRef}
            value={currentMessage}
            onChange={(e) => { setCurrentMessage(e.target.value); handleInput(); }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
          />
          <Button className="send-button" onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
   
  );
}

export default ChatBox;