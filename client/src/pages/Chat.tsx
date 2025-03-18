import React, { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon, StopIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { LoadingDots } from "@/components/LoadingDots";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  useCustomChat,
  type ModelType,
  type Message,
} from "@/hooks/useCustomChat";
import type { ComponentPropsWithoutRef } from "react";

const MODELS: { id: ModelType; name: string }[] = [
  { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet" },
  { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet" },
];

const markdownComponents: Components = {
  code(props) {
    const { className, children, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const isInline = !match;

    return isInline ? (
      <code
        className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5"
        {...rest}
      >
        {children}
      </code>
    ) : (
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0 }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  },
  p(props) {
    return <p className="mb-4 last:mb-0" {...props} />;
  },
  ul(props) {
    return <ul className="list-disc list-inside mb-4" {...props} />;
  },
  ol(props) {
    return <ol className="list-decimal list-inside mb-4" {...props} />;
  },
  li(props) {
    return <li className="mb-1" {...props} />;
  },
  a({ href, ...props }: ComponentPropsWithoutRef<"a">) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
        {...props}
      />
    );
  },
  blockquote(props) {
    return (
      <blockquote
        className="border-l-4 border-gray-300 pl-4 italic my-4"
        {...props}
      />
    );
  },
  h1(props) {
    return <h1 className="text-2xl font-bold mb-4" {...props} />;
  },
  h2(props) {
    return <h2 className="text-xl font-bold mb-3" {...props} />;
  },
  h3(props) {
    return <h3 className="text-lg font-bold mb-2" {...props} />;
  },
};

const Chat: React.FC = () => {
  const [selectedModel, setSelectedModel] =
    useState<ModelType>("claude-3-7-sonnet");
  const [useReasoning, setUseReasoning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    status,
    stop,
    reload,
    setMessages,
  } = useCustomChat({
    model: selectedModel,
    reasoning: useReasoning,
  });

  // Add effect to handle reasoning state based on model selection
  useEffect(() => {
    if (selectedModel === "claude-3-5-sonnet-latest") {
      setUseReasoning(false);
    }
  }, [selectedModel]);

  // Add refs for DOM elements
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input after loading
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Clear chat history
  const handleClear = () => {
    setMessages([]);
  };

  // Retry last message
  const handleRetry = () => {
    if (status === "error") {
      reload();
    }
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex items-center justify-center p-4">
      <div
        className={clsx(
          "w-full transition-all duration-500 ease-in-out",
          messages.length === 0 ? "max-w-2xl h-[400px]" : "max-w-4xl h-full"
        )}
      >
        <div className="bg-white rounded-xl shadow-lg w-full h-full flex flex-col overflow-hidden">
          <div
            className={clsx(
              "flex-1 p-6 overflow-y-auto space-y-6 min-h-0",
              messages.length === 0 && "flex items-center"
            )}
          >
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 w-full">
                Start a conversation by typing a message below.
              </div>
            )}
            {messages.map((message: Message, index: number) => (
              <div
                key={index}
                className={clsx("flex", {
                  "justify-end": message.role === "user",
                })}
              >
                <div
                  className={clsx(
                    "chat-message max-w-[85%] px-4 py-3 rounded-2xl",
                    {
                      "bg-heroku-purple text-white": message.role === "user",
                      "bg-gray-100 text-gray-900 markdown-body":
                        message.role === "assistant",
                    }
                  )}
                >
                  {message.role === "user" ? (
                    message.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-500 px-4 py-2 rounded-lg flex items-center gap-2">
                  <span>Error: {error.message}</span>
                  <button
                    onClick={handleRetry}
                    className="text-sm underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex">
                <div className="chat-message max-w-[85%] px-4 py-3 rounded-2xl bg-gray-100">
                  <LoadingDots className="py-2" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t bg-white p-4 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (status === "loading") return;
                setIsLoading(true);
                handleSubmit().finally(() => {
                  setIsLoading(false);
                });
              }}
              className="flex gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Send a message..."
                className="flex-1 rounded-xl border-0 bg-gray-100 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-heroku-purple disabled:bg-gray-50 disabled:text-gray-500"
                disabled={isLoading}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="rounded-xl bg-gray-100 p-3 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-heroku-purple"
                  title="Stop generating"
                >
                  <StopIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="rounded-xl bg-heroku-purple p-3 text-white hover:bg-heroku-dark focus:outline-none focus:ring-2 focus:ring-heroku-purple disabled:opacity-50"
                  title="Send message"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              )}
            </form>
            <div className="flex items-center gap-4 justify-between text-sm text-gray-500">
              <button
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700"
                disabled={messages.length === 0 || isLoading}
              >
                Clear Chat
              </button>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useReasoning}
                    onChange={(e) => setUseReasoning(e.target.checked)}
                    className="rounded border-gray-300 text-heroku-purple focus:ring-heroku-purple"
                    disabled={
                      isLoading || selectedModel !== "claude-3-7-sonnet"
                    }
                  />
                  <span className="font-medium">Reasoning</span>
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) =>
                    setSelectedModel(e.target.value as ModelType)
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-heroku-purple focus:ring-heroku-purple bg-transparent"
                  disabled={isLoading}
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
