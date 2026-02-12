import React, { useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  // Keep user logged in across refreshes.
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  return (
    <div>
      {user ? (
        <Home user={user} setUser={setUser} />
      ) : (
        <Login setUser={setUser} />
      )}
    </div>
  );
}

export default App;
