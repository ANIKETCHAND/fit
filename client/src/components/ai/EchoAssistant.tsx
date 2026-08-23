import { useState, useRef, useEffect } from "react";
import { Send, X, Minus, Sparkles, MessageSquare, Bot } from "lucide-react";
import { getAthleteProfile } from "@/lib/user-store";
import "./EchoAssistant.css";

// Vector Mascot SVG matching Echo's look
export function EchoMascotIcon({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Outer Glow Halo */}
      <circle cx="50" cy="52" r="38" fill="url(#echoGlow)" opacity="0.45" />

      {/* Main Mascot Body (Ghost / Cyber Creature with curved horn/cap) */}
      <path
        d="M 50 14 
           C 68 14, 82 28, 82 48 
           C 82 66, 80 82, 70 82 
           C 64 82, 60 74, 50 74 
           C 40 74, 36 82, 30 82 
           C 20 82, 18 66, 18 48 
           C 18 30, 32 14, 50 14 Z"
        fill="url(#echoBodyGrad)"
        stroke="#baff57"
        strokeWidth="3.5"
      />

      {/* Curled Top Horn/Tail Tip */}
      <path
        d="M 50 14 C 42 10, 36 2, 28 6 C 22 10, 26 18, 38 18"
        fill="#baff57"
        stroke="#84cc16"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Left Eye */}
      <ellipse cx="36" cy="46" rx="5.5" ry="9" fill="#070e0a" />
      <ellipse cx="38" cy="43" rx="2" ry="3.5" fill="#ffffff" />

      {/* Right Eye */}
      <ellipse cx="64" cy="46" rx="5.5" ry="9" fill="#070e0a" />
      <ellipse cx="66" cy="43" rx="2" ry="3.5" fill="#ffffff" />

      {/* Subtle Cheek Blushes */}
      <ellipse cx="28" cy="56" rx="4.5" ry="2.5" fill="#84cc16" opacity="0.6" />
      <ellipse cx="72" cy="56" rx="4.5" ry="2.5" fill="#84cc16" opacity="0.6" />

      <defs>
        <radialGradient id="echoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#baff57" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="echoBodyGrad" x1="50" y1="10" x2="50" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d9f99d" />
          <stop offset="0.45" stopColor="#a3e635" />
          <stop offset="1" stopColor="#4d7c0f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type ChatMessage = {
  id: string;
  sender: "echo" | "user";
  text: string;
  chips?: string[];
};

export function EchoAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const profile = getAthleteProfile();
  const firstName = profile.name.split(" ")[0];

  // Initialize greeting on first load
  useEffect(() => {
    setMessages([
      {
        id: "intro-1",
        sender: "echo",
        text: `Hello ${firstName}! I'm **Echo**, your intelligent FitTrack training & telemetry guide.\n\nHow can I help you today? You can ask me how to navigate features, calculate targets, understand muscle diagnostics, or optimize your workouts.`,
        chips: [
          "How do I use the 3D Body Map?",
          "How are daily calories calculated?",
          "Guide me through Workouts & Logging",
          "Am I on the right track?",
        ],
      },
    ]);
  }, [firstName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: "user", text: query },
    ];
    setMessages(newMessages);
    setInputMessage("");
    setIsTyping(true);

    // Generate intelligent contextual response
    setTimeout(() => {
      const response = generateAIResponse(query, firstName);
      setMessages((prev) => [
        ...prev,
        {
          id: `echo-${Date.now()}`,
          sender: "echo",
          text: response.text,
          chips: response.chips,
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="echo-assistant-container">
      {/* Floating Animated Mascot Button */}
      <button
        className="echo-mascot-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ask Echo AI Assistant"
        title="Ask Echo AI"
      >
        <div className="echo-mascot-pulse" />
        <div className="echo-mascot-svg-wrap">
          <EchoMascotIcon size={42} animated />
        </div>
        <span className="echo-mascot-tooltip">Need help? Ask Echo AI</span>
      </button>

      {/* TryHackMe-style AI Assistant Chat Dialog */}
      {isOpen && (
        <aside className="echo-chat-dialog" aria-label="Echo AI Chat Assistant">
          {/* Header */}
          <div className="echo-header">
            <div className="echo-header-left">
              <div className="echo-header-icon">
                <EchoMascotIcon size={24} />
              </div>
              <div className="echo-title-group">
                <div className="echo-title-row">
                  <span className="echo-title">Echo</span>
                  <span className="echo-beta-badge">Beta</span>
                </div>
                <span className="echo-subtitle">Powered by FitTrack AI</span>
              </div>
            </div>
            <div className="echo-header-actions">
              <button
                className="echo-header-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize Chat"
                title="Minimize"
              >
                <Minus size={16} />
              </button>
              <button
                className="echo-header-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="echo-messages-container" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`echo-msg echo-msg-${msg.sender}`}>
                {msg.sender === "echo" && (
                  <div className="echo-msg-sender-row">
                    <EchoMascotIcon size={16} />
                    <span>Echo</span>
                  </div>
                )}
                <div className="echo-msg-bubble">
                  {formatMarkdown(msg.text)}
                </div>

                {/* Prompt Suggestion Chips */}
                {msg.chips && msg.chips.length > 0 && (
                  <div className="echo-chips-row">
                    {msg.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        className="echo-chip-btn"
                        onClick={() => handleSend(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="echo-msg echo-msg-assistant">
                <div className="echo-msg-sender-row">
                  <EchoMascotIcon size={16} />
                  <span>Echo is thinking...</span>
                </div>
                <div className="echo-typing-indicator">
                  <span className="echo-typing-dot" />
                  <span className="echo-typing-dot" />
                  <span className="echo-typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Message Input */}
          <form
            className="echo-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="echo-input-field"
              placeholder="Type your question for Echo..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              type="submit"
              className="echo-send-btn"
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}

// Contextual AI Knowledge Generator
function generateAIResponse(
  query: string,
  firstName: string
): { text: string; chips?: string[] } {
  const q = query.toLowerCase();

  if (q.includes("3d") || q.includes("body map") || q.includes("anatomy") || q.includes("muscle")) {
    return {
      text: `**Interactive 3D Anatomy Explorer:**\n\n• **Selection & Raycasting:** Click or hover any muscle group (Chest, Core, Shoulders, Biceps, Triceps, Back, Glutes, Quads, Calves) to view real-time readiness telemetry, fatigue scores, and recovery state.\n• **View Angles:** Use the **FRONT**, **BACK**, and **SIDE** buttons in the bottom control dock to inspect muscle groups.\n• **Auto-Orbit:** Toggle the continuous rotate button for a cinematic 3D scan.\n• **Recommended Protocols:** Selecting a muscle displays scientifically backed exercises, optimal sets/reps, and current weekly volume on the right diagnostic card!`,
      chips: ["How are daily calories calculated?", "Where do I log workouts?", "Explain readiness score"],
    };
  }

  if (q.includes("calori") || q.includes("kcl") || q.includes("nutrition") || q.includes("food") || q.includes("protein") || q.includes("macro") || q.includes("target")) {
    return {
      text: `**Autonomous Precision Fueling & Daily Targets:**\n\n• **Dynamic Metabolic Calculation:** Your daily targets adjust automatically based on your **height**, **weight**, **age**, **gender**, and **activity level** using the Mifflin-St Jeor formula.\n• **Macronutrient Split:**\n  - **Protein:** ~2.0g per kg of body weight for optimal muscle recovery.\n  - **Carbs:** ~45% of total intake for glycogen replenishment.\n  - **Fats:** ~25-30% for hormonal balance.\n• **Logging Meals:** Visit the **Nutrition** tab (/log-food) to log breakfast, lunch, dinner, and snacks with automated macro breakdowns!`,
      chips: ["How do I log a workout?", "How do streak milestones work?", "Show me my profile analytics"],
    };
  }

  if (q.includes("workout") || q.includes("exercise") || q.includes("training") || q.includes("bench") || q.includes("squat") || q.includes("log-workout") || q.includes("session")) {
    return {
      text: `**Workouts & Training Execution:**\n\n• **Exercise Library (/exercise-library):** Browse 40+ structured movements across Chest, Back, Shoulders, Arms, Core, and Legs with form cues.\n• **Logging Sets & Volume (/log-workout):** Record reps, load (kg), and RPE to track progressive overload.\n• **Live Command Timer (/start-session):** Use the focused workout timer with countdown intervals and rest period notifications.\n• **Muscle Diagnostic:** Click any muscle on the home screen to instantly start a tailored workout protocol!`,
      chips: ["How do I track GPS runs?", "What are achievements?", "Explain 3D Body Map"],
    };
  }

  if (q.includes("stuck") || q.includes("help") || q.includes("guide") || q.includes("right track") || q.includes("how to use") || q.includes("features")) {
    return {
      text: `Here is a quick tour of **FitTrack Performance OS** for you, ${firstName}:\n\n1. **Command Center (/overview):** Daily continuity streak, vital telemetry rings, and interactive 3D body stage.\n2. **Workouts (/exercise-library & /log-workout):** Muscle-targeted protocols, progressive overload tracking, and live timers.\n3. **Fueling (/log-food):** Daily calorie target ledger with protein, carb, and lipid dials.\n4. **Telemetry & Weight (/log-weight):** Body weight trend charts and milestone projections.\n5. **GPS Trace (/gps):** Real-time route tracking for outdoor cardio and runs.\n6. **Achievements (/achievements):** Unlockable athletic badges and streak milestones.`,
      chips: ["How do I use the 3D Body Map?", "How are daily calories calculated?", "How do I edit my profile?"],
    };
  }

  if (q.includes("gps") || q.includes("run") || q.includes("map") || q.includes("trace")) {
    return {
      text: `**GPS Route Tracking (/gps):**\n\n• Track real-time pace, distance in kilometers, elevation gain, and elapsed time.\n• Automatically renders interactive route vectors on the GPS trace canvas.\n• Saves completed sessions to your athlete ledger to sync cardio burn with your daily calorie dial!`,
      chips: ["How do I log food?", "How do I log a workout?"],
    };
  }

  if (q.includes("profile") || q.includes("name") || q.includes("weight") || q.includes("height") || q.includes("settings")) {
    return {
      text: `**Athlete Identity & Profile Analytics (/profile):**\n\n• View your GitHub-style training continuity contribution matrix.\n• Click **Edit Profile** to update your display name, height, weight, fitness goals, and profile avatar photo.\n• Updating your height/weight will immediately recalculate your daily calorie and macro targets across the entire app!`,
      chips: ["How are daily calories calculated?", "Where do I find my achievements?"],
    };
  }

  // Default intelligent assistant response
  return {
    text: `That's a great question, ${firstName}! Here is what you need to know:\n\n• For fitness progression, maintain **progressive overload** and ensure you hit your **daily protein target** (~2g/kg).\n• Keep your **Daily Continuity Streak** active by logging training sessions or nutrition daily.\n• You can use the top navigation and sidebar menu to navigate between the **3D Anatomy Stage**, **Workouts**, **Nutrition**, and **Progress Analytics** at any time!`,
    chips: [
      "How do I use the 3D Body Map?",
      "How are daily calories calculated?",
      "Guide me through Workouts & Logging",
    ],
  };
}

// Simple Markdown Formatter for clean rendering
function formatMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    if (!line.trim()) return <div key={idx} style={{ height: 6 }} />;

    // Bullet points
    if (line.startsWith("• ") || line.startsWith("- ")) {
      const content = line.substring(2);
      return (
        <li key={idx} style={{ marginLeft: 16, marginBottom: 4 }}>
          {parseBold(content)}
        </li>
      );
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <li key={idx} style={{ marginLeft: 16, marginBottom: 4 }}>
          <strong>{numberedMatch[1]}.</strong> {parseBold(numberedMatch[2])}
        </li>
      );
    }

    return (
      <p key={idx} style={{ margin: "0 0 6px 0" }}>
        {parseBold(line)}
      </p>
    );
  });
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
