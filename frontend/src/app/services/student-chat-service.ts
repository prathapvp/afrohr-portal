import axiosInstance from "../interceptor/AxiosInterceptor";

export interface StudentAdvisorChatMessage {
  role: "assistant" | "user";
  content: string;
}

export interface StudentAdvisorChatRequest {
  message: string;
  decisionMode?: "determined" | "exploring" | string;
  targetRole?: string;
  primaryInterest?: string;
  primaryField?: string;
  backgroundLevel?: string;
  timeline?: string;
  skills?: string;
  recommendationSummary?: string;
  recommendedRoles?: string[];
  history?: StudentAdvisorChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxResponseWords?: number;
}

export interface StudentAdvisorChatResponse {
  reply: string;
  provider: string;
}

interface StudentAdvisorChatStreamHandlers {
  onChunk: (chunk: string) => void;
  onDone?: () => void;
}

export async function chatWithStudentAdvisor(payload: StudentAdvisorChatRequest) {
  const response = await axiosInstance.post("/dashboard/students/chatbot", payload);
  return response.data as StudentAdvisorChatResponse;
}

export async function streamStudentAdvisorChat(payload: StudentAdvisorChatRequest, handlers: StudentAdvisorChatStreamHandlers) {
  const response = await fetch("/api/ahrm/v3/dashboard/students/chatbot/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Chat stream failed with status ${response.status}`;
    try {
      const body = await response.json() as { errorMessage?: string };
      if (body?.errorMessage) {
        message = body.errorMessage;
      }
    } catch {
      // no-op, keep default message
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Chat stream response body is empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const eventBlock of events) {
      const lines = eventBlock.split("\n");
      let eventName = "message";
      const dataLines: string[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        }
        if (line.startsWith("data:")) {
          const dataPart = line.slice(5);
          dataLines.push(dataPart.startsWith(" ") ? dataPart.slice(1) : dataPart);
        }
      }

      const data = dataLines.join("\n");
      if (!data) {
        continue;
      }

      if (eventName === "done") {
        handlers.onDone?.();
        return;
      }

      if (eventName === "error") {
        throw new Error(data || "Student advisor stream failed.");
      }

      handlers.onChunk(data);
    }
  }

  handlers.onDone?.();
}