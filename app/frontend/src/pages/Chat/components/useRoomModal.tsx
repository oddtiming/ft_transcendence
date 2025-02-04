import { useState, useRef, useEffect } from "react";

export const useRoomModal = (showModal: boolean, closeModal: () => void) => {
  const [roomName, setRoomName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const roomNameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && roomNameInput.current) {
      roomNameInput.current.focus();
    }
  }, [showModal]);

  //FIXME: speaks for itself
  if (roomName === "fuck-es-lint") closeModal();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    roomName,
    setRoomName,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    roomNameInput,
    togglePasswordVisibility
  };
};
