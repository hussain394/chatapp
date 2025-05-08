import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);

  // Toast options are not part of the issue but good to validate user authentication
  const handleAuthentication = async () => {
    if (!localStorage.getItem(import.meta.env.VITE_LOCALHOST_KEY)) {
      navigate("/login");
    } else {
      const user = JSON.parse(localStorage.getItem(import.meta.env.VITE_LOCALHOST_KEY));
      setCurrentUser(user);
    }
  };

  // Fetch the user data and validate login
  useEffect(() => {
    handleAuthentication();
  }, [navigate]);

  // Establish socket connection safely with cleanup
  useEffect(() => {
    if (currentUser) {
      // Initialize socket only when user is ready
      socket.current = io(host);

      // Send current user ID
      socket.current.emit("add-user", currentUser._id);

      // Cleanup socket connection on unmount
      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [currentUser]);

  // Fetch user contacts only if `currentUser` is authenticated and `isAvatarImageSet`
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          try {
            const { data } = await axios.get(`${allUsersRoute}/${currentUser._id}`);
            setContacts(data);
          } catch (error) {
            console.error("Error fetching contacts:", error);
          }
        } else {
          navigate("/setAvatar");
        }
      }
    };
    fetchContacts();
  }, [currentUser, navigate]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  return (
    <>
      <Container>
        <div className="container">
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer currentChat={currentChat} socket={socket} />
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;

  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
