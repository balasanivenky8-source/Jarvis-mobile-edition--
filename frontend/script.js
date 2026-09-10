// ======================================================
// J.A.R.V.I.S MOBILE EDITION
// Episode 04 - THE VOICE
// ======================================================


// ======================================================
// 1. GEMINI API KEY
// ======================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
  API_KEY = prompt("Enter your Gemini API Key:");

  if (API_KEY) {
    localStorage.setItem("jarvis_key", API_KEY);
  }
}


// ======================================================
// 2. MODELS
// ======================================================

const MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest"
];


// ======================================================
// 3. GET HTML ELEMENTS
// ======================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send");
const status = document.getElementById("status");
const voiceBtn = document.getElementById("voice-btn");
const resetKeyBtn = document.getElementById("reset-key");


// ======================================================
// 4. ADD MESSAGE
// ======================================================

function addMessage(text, type) {

  const div = document.createElement("div");

  div.className = "msg " + type;

  div.innerText = text;

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;
}


// ======================================================
// 5. GEMINI API
// ======================================================

async function callGemini(promptText) {

  if (!API_KEY) {
    throw new Error("Gemini API Key is missing.");
  }

  let lastError = null;

  for (const model of MODELS) {

    try {

      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent?key=" +
        API_KEY;

      const response = await fetch(url, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          contents: [
            {
              parts: [
                {
                  text:
                    "You are J.A.R.V.I.S, a helpful personal AI assistant. " +
                    "Give clear and concise answers. " +
                    "Be friendly and intelligent.\n\n" +
                    promptText
                }
              ]
            }
          ]

        })

      });


      const data = await response.json();


      if (data.error) {

        lastError =
          new Error(data.error.message || "Gemini API error");

        const errorText =
          data.error.message || "";

        if (
          /high demand|temporar|quota|rate|unavailable|no longer available|deprecated/i
            .test(errorText)
        ) {
          continue;
        }

        throw lastError;
      }


      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
      ) {

        return data.candidates[0]
          .content
          .parts[0]
          .text;
      }


      throw new Error("No response received from Gemini.");

    }

    catch (error) {

      lastError = error;

    }

  }


  throw lastError || new Error("Gemini request failed.");
}


// ======================================================
// 6. ASK GEMINI
// ======================================================

async function askGemini(promptText) {

  addMessage(
    "J.A.R.V.I.S: Thinking...",
    "ai"
  );

  status.innerText = "BRAIN: THINKING...";


  try {

    const reply = await callGemini(promptText);


    const aiMessages =
      chat.querySelectorAll(".ai");

    const lastAIMessage =
      aiMessages[aiMessages.length - 1];


    if (lastAIMessage) {

      lastAIMessage.innerText =
        "J.A.R.V.I.S: " + reply;

    }


    status.innerText =
      "BRAIN: CONNECTED";


    // Speak the answer
    speak(reply);

  }

  catch (error) {

    const aiMessages =
      chat.querySelectorAll(".ai");

    const lastAIMessage =
      aiMessages[aiMessages.length - 1];


    const message =
      "ERROR: " +
      (error.message || "Something went wrong.");


    if (lastAIMessage) {

      lastAIMessage.innerText =
        "J.A.R.V.I.S: " + message;

    }


    status.innerText =
      "BRAIN: ERROR";

    console.error(error);
  }
}


// ======================================================
// 7. SPEECH RECOGNITION
// ======================================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

  recognition = new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.continuous = false;

  recognition.interimResults = false;


  recognition.onstart = function () {

    micBtn.innerText = "LISTENING...";

    status.innerText =
      "MIC: LISTENING...";

  };


  recognition.onresult = function (event) {

    const text =
      event.results[0][0].transcript;


    addMessage(
      "YOU: " + text,
      "user"
    );


    status.innerText =
      "BRAIN: PROCESSING...";


    askGemini(text);

  };


  recognition.onerror = function (event) {

    console.error(
      "Speech recognition error:",
      event.error
    );


    micBtn.innerText = "🎤";

    status.innerText =
      "MIC: ERROR - " + event.error;

  };


  recognition.onend = function () {

    micBtn.innerText = "🎤";

  };

}


// ======================================================
// 8. MIC BUTTON
// ======================================================

micBtn.onclick = function () {

  if (!recognition) {

    alert(
      "Speech Recognition is not supported in this browser."
    );

    return;
  }


  try {

    recognition.start();

  }

  catch (error) {

    console.log(
      "Recognition already running."
    );

  }

};


// ======================================================
// 9. TEXT TO SPEECH
// ======================================================

let voices = [];


function loadVoices() {

  voices =
    window.speechSynthesis.getVoices();

}


loadVoices();


if ("onvoiceschanged" in speechSynthesis) {

  speechSynthesis.onvoiceschanged =
    loadVoices;

}


function speak(text) {

  if (!("speechSynthesis" in window)) {

    console.log(
      "Text-to-Speech is not supported."
    );

    return;
  }


  speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(text);


  utterance.rate = 1.05;

  utterance.pitch = 0.85;


  // English voice
  const englishVoice =
    voices.find(function (voice) {

      return voice.lang &&
        voice.lang.startsWith("en");

    });


  if (englishVoice) {

    utterance.voice =
      englishVoice;

  }


  utterance.onstart = function () {

    status.innerText =
      "VOICE: SPEAKING...";

  };


  utterance.onend = function () {

    status.innerText =
      "BRAIN: CONNECTED";

  };


  speechSynthesis.speak(
    utterance
  );

}


// ======================================================
// 10. SEND BUTTON
// ======================================================

sendBtn.onclick = function () {

  const text =
    input.value.trim();


  if (!text) {

    return;

  }


  addMessage(
    "YOU: " + text,
    "user"
  );


  input.value = "";


  askGemini(text);

};


// ======================================================
// 11. ENTER KEY
// ======================================================

input.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {

      sendBtn.click();

    }

  }
);


// ======================================================
// 12. TEST VOICE
// ======================================================

voiceBtn.onclick = function () {

  speak(
    "Hello. I am J.A.R.V.I.S. Voice system is working."
  );

};


// ======================================================
// 13. RESET API KEY
// ======================================================

resetKeyBtn.onclick = function () {

  const confirmReset =
    confirm(
      "Reset your Gemini API key?"
    );


  if (confirmReset) {

    localStorage.removeItem(
      "jarvis_key"
    );


    alert(
      "API key removed. Reload the page and enter a new key."
    );


    location.reload();

  }

};


// ======================================================
// 14. INITIAL STATUS
// ======================================================

if (API_KEY) {

  status.innerText =
    "BRAIN: READY";

} else {

  status.innerText =
    "BRAIN: API KEY REQUIRED";

}


// ======================================================
// J.A.R.V.I.S READY
// ======================================================

console.log(
  "J.A.R.V.I.S Voice System Ready."
);
