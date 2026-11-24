import React from "react";
import { login, auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
const LoginButton = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const loggedInUser = await login();
      if (loggedInUser) {
        navigate("/");
      }
    } catch (error) {
      const message =
        error?.code === "auth/unauthorized-domain"
          ? "Этот домен не добавлен в Firebase Authentication. Добавь домен Netlify в Firebase Console -> Authentication -> Settings -> Authorized domains."
          : `Не удалось войти: ${error?.message || error}`;

      alert(message);
    }
  };
  return (
    !user && (
      <button onClick={handleLogin} className="button_login">
        <span>Войти</span> <img src="./img/login.svg" alt="" />
      </button>
    )
  );
};

export default LoginButton;
