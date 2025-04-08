"use client";

import { useState, useRef } from "react";
import { IconMicrophoneFilled } from "@tabler/icons-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("Recording... Speak now");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setRecordingStatus("Error accessing microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus("Processing audio...");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Get the base64 string without the data URL prefix
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch("/api/query-processor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioFile: base64Audio,
          requestVoiceAuth: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setRecordingStatus(`Error: ${data.error}`);
      } else {
        setQuery(data.query?.original || "");
        console.log(JSON.stringify(data));
        setRecordingStatus("Query processed successfully");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setRecordingStatus("Error processing audio");
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setRecordingStatus("Processing query...");

      // First get the schema
      const schemaResponse = await fetch("/api/schema");
      if (!schemaResponse.ok) {
        throw new Error("Failed to fetch schema");
      }
      const schema = await schemaResponse.json();

      // Then send to Gemini with schema
      const geminiResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: query,
          schema: schema,
        }),
      });

      if (!geminiResponse.ok) {
        throw new Error("Gemini processing failed");
      }

      const { sqlQuery, explanation } = await geminiResponse.json();
      setQuery(sqlQuery);
      setRecordingStatus(`Processing complete: ${explanation}`);
    } catch (error) {
      console.error("Error processing query:", error);
      setRecordingStatus("Error processing query");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-[#bfff00] text-center">
          Good Morning, what would you like to enquire about today?
        </h1>

        <div className="mb-8 flex flex-col items-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full ${
              isRecording ? "bg-red-500 hover:bg-red-600" : ""
            } transition-colors`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <IconMicrophoneFilled size={48} className="text-[#bfff00]" />
          </button>
          {recordingStatus && (
            <p className="mt-4 text-sm text-[#bfff00]/80">{recordingStatus}</p>
          )}
        </div>

        <form onSubmit={handleQuerySubmit} className="relative w-[65%]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or type your query here... (Press Enter to submit)"
            className="w-full px-4 py-2 rounded-lg bg-transparent border-2 border-[#00e1ff] text-[#bfff00] placeholder:text-[#bfff00]/60 focus:outline-none focus:ring-2 focus:ring-[#00e1ff]"
          />
        </form>
      </div>
    </div>
  );
}
