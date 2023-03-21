/*******************/
/*     System      */
/*******************/
import { useContext, useEffect, useState } from "react";

/********************/
/*     Contexts     */
/********************/
import { WebsocketContext } from "../../contexts/WebsocketContext";

/***********************/
/*     Components      */
/***********************/
import SideBar from "../../components/SideBar";
import ChatArea from "./components/ChatArea";

/***************/
/*     CSS     */
/***************/
import "./styles/ChatPage.css";
import ChatContext from "./components/ChatContext";
import RoomList from "./components/RoomList";

export type MessagePayload = {
  user: string;
  room: string;
  message: string;
};

export type RoomType = {
  name: string;
};

export default function ChatPage() {
  /***********************/
  /*   State Variables   */
  /***********************/

  const { currentRoomName, tempUsername, setTempUsername } =
    useContext(ChatContext);

  /**************/
  /*   Socket   */
  /**************/
  const socket = useContext(WebsocketContext);

  // FIXME: temporary addition for dev build to test user creation
  // TODO: remove this when user creation is implemented
  useEffect(() => {
    if (socket && !tempUsername) {
      let tempUser = "temp_user";
      let count = 0;
      // Try to create a temporary user
      const createTempUser = (username) => {
        socket.emit("createUser", username);
      };

      // Server acknowledges successful creation, returns username
      socket.on("userCreated", (username) => {
        setTempUsername(username);
      });

      // Name is taken, increment count and try again
      socket.on("userExists", () => {
        count += 1;
        tempUser = `temp_user${count}`;
        createTempUser(tempUser);
      });
      createTempUser(tempUser);
    }

    return () => {
      socket.off("userCreated");
      socket.off("userExists");
    };
  }, [socket, tempUsername]);

  /**************************/
  /*   Returned fragment   */
  /*************************/
  return (
    <div className="chat-page">
      <SideBar />
      <RoomList />
      <div className="room-area">
        <ChatArea key={currentRoomName} />
      </div>
    </div>
  );
}
