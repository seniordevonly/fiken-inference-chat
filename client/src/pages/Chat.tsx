import type { ComponentPropsWithoutRef } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import {
  PaperAirplaneIcon,
  StopIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactMarkdown, { Components } from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { LoadingDots } from '@/components/LoadingDots';
import { type Message, type ModelType, useCustomChat } from '@/hooks/useCustomChat';

const MODELS: { id: ModelType; name: string }[] = [
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
];

const CodeBlock = (props: ComponentPropsWithoutRef<'code'>) => {
  const { className, children, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isInline = !match;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return isInline ? (
    <code
      className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-gray-800 dark:text-gray-200"
      {...rest}
    >
      {children}
    </code>
  ) : (
    <div className="relative group rounded-lg overflow-hidden">
      <div className="absolute right-2 top-2 z-10">
        <CopyToClipboard text={String(children)} onCopy={handleCopy}>
          <button
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={isCopied ? 'Copied!' : 'Copy code'}
          >
            {isCopied ? (
              <CheckIcon className="h-5 w-5 text-green-500" />
            ) : (
              <ClipboardIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-300" />
            )}
          </button>
        </CopyToClipboard>
      </div>
      <div className="!mt-0">
        <SyntaxHighlighter
          language={language || 'text'}
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            borderRadius: '0.5rem',
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ReasoningBlock: React.FC<{ thinking: string }> = ({ thinking }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
        Reasoning
      </button>
      {isExpanded && (
        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
          {thinking}
        </div>
      )}
    </div>
  );
};

const markdownComponents: Components = {
  code: CodeBlock,
  p(props) {
    return <p className="mb-3 last:mb-0 text-gray-800" {...props} />;
  },
  ul(props) {
    return <ul className="list-disc list-inside mb-3 text-gray-800" {...props} />;
  },
  ol(props) {
    return <ol className="list-decimal list-inside mb-3 text-gray-800" {...props} />;
  },
  li(props) {
    return <li className="mb-1 text-gray-800" {...props} />;
  },
  a({ href, ...props }: ComponentPropsWithoutRef<'a'>) {
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
        className="border-l-2 border-gray-300 pl-4 italic my-3 text-gray-700"
        {...props}
      />
    );
  },
  h1(props) {
    return <h1 className="text-xl font-semibold mb-3 text-gray-900" {...props} />;
  },
  h2(props) {
    return <h2 className="text-lg font-semibold mb-2 text-gray-900" {...props} />;
  },
  h3(props) {
    return <h3 className="text-base font-semibold mb-2 text-gray-900" {...props} />;
  },
  table(props) {
    return (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm" {...props} />
      </div>
    );
  },
  thead(props) {
    return <thead className="bg-gray-50" {...props} />;
  },
  tbody(props) {
    return <tbody className="bg-white divide-y divide-gray-100" {...props} />;
  },
  tr(props) {
    return <tr className="border-b border-gray-100 last:border-0" {...props} />;
  },
  th(props) {
    return (
      <th
        className="px-4 py-3 text-left text-gray-700 font-semibold border-b border-gray-200"
        {...props}
      />
    );
  },
  td(props) {
    return <td className="px-4 py-3 text-gray-800" {...props} />;
  },
};

const Chat: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<ModelType>('claude-3-7-sonnet');
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
    if (selectedModel === 'claude-3-5-sonnet-latest') {
      setUseReasoning(false);
    }
  }, [selectedModel]);

  // Update isLoading state based on status
  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  // Add refs for DOM elements
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (status === 'error') {
      void reload();
    }
  };

  // Remove standalone scrollToBottom function
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-[calc(100vh-3rem)] flex items-center justify-center p-4">
      <div
        className={clsx(
          'w-full transition-all duration-500 ease-in-out',
          messages.length === 0 ? 'max-w-2xl h-[400px]' : 'max-w-4xl h-full'
        )}
      >
        <div className="bg-white rounded-xl shadow-lg w-full h-full flex flex-col overflow-hidden">
          <div
            className={clsx(
              'flex-1 p-6 overflow-y-auto space-y-6 min-h-0',
              messages.length === 0 && 'flex items-center'
            )}
          >
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 w-full">
                Start a conversation by typing a message below.
              </div>
            )}
            {messages.map((message: Message) => (
              <div
                key={`${message.role}-${message.content.substring(0, 32)}`}
                className={clsx('flex', {
                  'justify-end': message.role === 'user',
                  'justify-start': message.role === 'assistant',
                })}
              >
                {message.role === 'assistant' ? (
                  <div className="flex flex-col max-w-[85%] text-base">
                    {message.reasoning && <ReasoningBlock thinking={message.reasoning.thinking} />}
                    <div className="text-gray-800">
                      {/[*#\[\]_`]/.test(message.content) || message.content.includes('\n\n') ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={markdownComponents}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="chat-message max-w-[85%] px-4 py-3 rounded-2xl bg-heroku-purple text-white">
                    {message.content}
                  </div>
                )}
              </div>
            ))}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-500 px-4 py-2 rounded-lg flex items-center gap-2">
                  <span>Error: {error.message}</span>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-sm underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <LoadingDots className="py-1" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t bg-white p-4 space-y-4">
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (isLoading) return;
                setIsLoading(true);
                try {
                  await handleSubmit();
                } catch (error) {
                  console.error('Error submitting form:', error);
                } finally {
                  setIsLoading(false);
                }
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
                type="button"
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
                    onChange={e => setUseReasoning(e.target.checked)}
                    className="rounded border-gray-300 text-heroku-purple focus:ring-heroku-purple"
                    disabled={isLoading || selectedModel !== 'claude-3-7-sonnet'}
                  />
                  <span className="font-medium">Reasoning</span>
                </label>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value as ModelType)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-heroku-purple focus:ring-heroku-purple bg-transparent"
                  disabled={isLoading}
                >
                  {MODELS.map(model => (
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
