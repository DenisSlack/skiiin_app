import React from "react";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Skiiin IQ</h1>
      <p>Приложение загружается...</p>
      <div>
        <h2>Тест соединения с API</h2>
        <button onClick={() => {
          fetch('/api/auth/user')
            .then(r => r.json())
            .then(data => alert(JSON.stringify(data)))
            .catch(err => alert('Ошибка: ' + err.message));
        }}>
          Проверить API
        </button>
      </div>
    </div>
  );
}

export default App;