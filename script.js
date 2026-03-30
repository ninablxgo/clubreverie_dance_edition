const channel = "clubreverie";
let socket = null;
let isConnected = false;
let pendingMessage = null;

// 🔹 Nettoyage pseudo
function sanitizeNick(raw) {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .substring(0, 20);
}

// 🔹 Connexion
function connect(nick) {
  socket = new WebSocket("wss://hack.chat/chat-ws");

  socket.onopen = () => {
    console.log("OPEN ✅");

    socket.send(JSON.stringify({
      cmd: "join",
      channel: channel,
      nick: nick
    }));

    isConnected = true;

    document.getElementById("status").innerText =
      "✅ connected to #" + channel;

    // envoyer message en attente si existe
    if (pendingMessage) {
      socket.send(JSON.stringify({
        cmd: "chat",
        text: pendingMessage
      }));
      pendingMessage = null;
    }
  };

  socket.onerror = (e) => {
    console.log("ERROR ❌", e);
    document.getElementById("status").innerText = "❌ connection error";
  };

  socket.onclose = () => {
    document.getElementById("status").innerText = "🔌 disconnected";
    isConnected = false;
  };
}

// 🔹 Envoi message
function sendMessage() {
  const text = document.getElementById("text").value;
  const rawNick = document.getElementById("nick").value || "anon";
  const nick = sanitizeNick(rawNick);

  if (!text) return;

  localStorage.setItem("nickname", nick);

  const button = document.getElementById("sendBtn");

  // si pas connecté → stocker message et connecter
  if (!socket || socket.readyState !== WebSocket.OPEN || !isConnected) {
    document.getElementById("status").innerText = "⏳ connecting...";
    pendingMessage = text;
    connect(nick);
    return;
  }

  socket.send(JSON.stringify({
    cmd: "chat",
    text: text
  }));

  document.getElementById("text").value = "";

  // feedback bouton
  button.classList.add("sent");
  setTimeout(() => {
    button.classList.remove("sent");
  }, 200);
}

// 🔹 Charger pseudo
window.onload = () => {
  const savedNick = localStorage.getItem("nickname");
  if (savedNick) {
    document.getElementById("nick").value = savedNick;
  }
};

// 🔹 Nettoyage live
document.addEventListener("DOMContentLoaded", () => {
  const nickInput = document.getElementById("nick");

  nickInput.addEventListener("input", function () {
    this.value = sanitizeNick(this.value);
  });
});