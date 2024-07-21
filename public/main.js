const recordBtn = document.getElementById("record-button");
const translation_lang = document.getElementById("translation-language")
const transcript = document.getElementById("transcript")
const translation = document.getElementById("translation")

let isRecording = false;
let recorder; //to hold the object responsible for recording
let rt; //to store real-time transcriber 

const run = async () => {
  if (isRecording) {
    if(rt) {
      await rt.close(false); //close the connection
      rt = null;
    }

    if (recorder) {
      recorder.stopRecording();
      recorder = null;
    }
    recordBtn.innerText = "Record";
    transcript.innerText = "";
    translation.innerText = "";
  } else {
    recordBtn.innerText = "Loading...";
    const response = await fetch("/token");
    const data = await response.json();
    rt = new assemblyai.RealtimeService({ token: data.token });

    const texts = {}; //store the text from aai
    let translatedText = "";
    
    rt.on("transcript", async (message) => {
      let msg = "";
      texts[message.audio_start] = message.text;
      const keys = Object.keys(texts);
      keys.sort((a, b) => a - b);
      for (const key of keys) {
        if (texts[key]) {
          msg += ` ${texts[key]}`;
        }
      }
      transcript.innerText = msg;
      if (message.message_type === "FinalTranscript") {
        const response = await fetch("/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: message.text,
            target_lang: translation_lang.value,
          }),
        });
        const data = await response.json();
        translatedText += ` ${data.translation.text}`;
        translation.innerText = translatedText;
      }      
    });

    rt.on("error", async (error) => {
      console.error(error);
      await rt.close();
    });
    
    rt.on("close", (event) => {
      console.log(event);
      rt = null;
    });

    await rt.connect();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        recorder = new RecordRTC(stream, {
          type: "audio",
          mimeType: "audio/webm;codecs=pcm",
          recorderType: StereoAudioRecorder,
          timeSlice: 250,
          desiredSampRate: 16000,
          numberOfAudioChannels: 1,
          bufferSize: 16384,
          audioBitsPerSecond: 128000,
          ondataavailable: async (blob) => {
            console.log("Audio captured");
            if(rt) {
              rt.sendAudio(await blob.arrayBuffer());
            }
          },
        });

        recorder.startRecording();
        recordBtn.innerText = "Stop Recording";
      })
      .catch((err) => console.error(err));
  }
  isRecording = !isRecording;
};

recordBtn.addEventListener("click", () => {
  run();
});
