import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
        withCredentials: true,
        auth: { token: localStorage.getItem("token") },
      },
    );

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  /** Subscribe socket to a list of site IDs. */
  const subscribe = useCallback((siteIds) => {
    if (socketRef.current) {
      socketRef.current.emit("subscribe", { siteIds });
    }
  }, []);

  /** Register an event listener; returns a cleanup function. */
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }, []);

  return (
    <SocketContext.Provider value={{ connected, subscribe, on }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
