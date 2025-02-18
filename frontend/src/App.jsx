import { useEffect, useState } from "react"; // Import React hooks for state and effect management
import "./App.css"; // Import the CSS file for styling
import io from "socket.io-client"; // Import the Socket.IO client library
import Editor from "@monaco-editor/react"; // Import the Monaco Editor component

const socket = io("http://localhost:5000"); // Connect to the Socket.IO server

const App = () => {
  const [joined, setJoined] = useState(false); // State to track if the user has joined a room
  const [roomId, setRoomId] = useState(""); // State to store the room ID
  const [userName, setUserName] = useState(""); // State to store the user's name
  const [language, setLanguage] = useState("javascript"); // State to store the selected programming language
  const [code, setCode] = useState("// start code here"); // State to store the code content
  const [copySuccess, setCopySuccess] = useState(""); // State to track copy success message
  const [users, setUsers] = useState([]); // State to store the list of users in the room
  const [typing, setTyping] = useState(""); // State to track if a user is typing

  // Effect to handle socket events for user actions
  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users); // Update the list of users when a user joins
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode); // Update the code content when there's a code change
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`); // Show typing indicator when a user is typing
      setTimeout(() => setTyping(""), 2000); // Clear typing indicator after 2 seconds
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage); // Update the programming language when it changes
    });

    // Cleanup socket event listeners on component unmount
    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  // Effect to handle socket event for leaving the room before the window unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Function to join a room
  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true); // Set joined state to true
    }
  };

  // Function to leave a room
  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false); // Set joined state to false
    setRoomId(""); // Clear the room ID
    setUserName(""); // Clear the user's name
    setCode("// start code here"); // Reset the code content
    setLanguage("javascript"); // Reset the programming language
  };

  // Function to copy the room ID to the clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!"); // Show copy success message
    setTimeout(() => setCopySuccess(""), 2000); // Clear copy success message after 2 seconds
  };

  // Function to handle code changes
  const handleCodeChange = (newCode) => {
    setCode(newCode); // Update the code content
    socket.emit("codeChange", { roomId, code: newCode }); // Emit code change event to the server
    socket.emit("typing", { roomId, userName }); // Emit typing event to the server
  };

  // Function to handle language changes
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage); // Update the programming language
    socket.emit("languageChange", { roomId, language: newLanguage }); // Emit language change event to the server
  };

  // Render the join room form if the user has not joined a room
  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  // Render the code editor and other UI elements if the user has joined a room
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">
            Copy Id
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in Room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.slice(0, 8)}...</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height={"100%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
};

export default App; // Export the App component
