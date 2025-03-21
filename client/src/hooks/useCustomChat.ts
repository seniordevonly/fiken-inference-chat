import React, { useRef, useState } from 'react';
import { Message, ChatError, StreamChunk, UseCustomChatProps } from '@/types/chat';

export function useCustomChat({ model, reasoning, agents, historyLimit = 6 }: UseCustomChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<ChatError | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const clearMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    const finalMessages = typeof newMessages === 'function' ? newMessages(messages) : newMessages;
    setMessages(finalMessages);
    if (finalMessages.length === 0) {
      setError(null);
      setStatus('idle');
    }
  };

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('idle');
    }
  };

  const handleChatRequest = async (messageContent: string, previousMessages: Message[]) => {
    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setStatus('loading');

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Filter out agent messages when sending to server
      const filteredMessages = [...previousMessages, userMessage].filter(
        msg => msg.role !== 'agent' || msg.content.trim() !== ''
      );
      const recentMessages = filteredMessages.slice(-historyLimit);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          model,
          reasoning,
          agents,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || `Request failed with status ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedToolMessage = '';
      let accumulatedContent = '';
      let accumulatedReasoning = '';
      let accumulatedToolCalls: NonNullable<Message['tool_calls']> = [];

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.replace(/^data:\s?/, '');

            if (data === '[DONE]') continue;

            try {
              const chunk: StreamChunk = JSON.parse(data);
              const content =
                chunk.choices[0]?.delta?.content || chunk.choices[0]?.message?.content;
              const reasoningDelta = chunk.choices[0]?.delta?.reasoning?.thinking;
              const toolCallsDelta =
                chunk.choices[0]?.delta?.tool_calls || chunk.choices[0]?.message?.tool_calls;

              // If this chunk has tool calls, accumulate them
              if (toolCallsDelta != null) {
                const newToolCalls = toolCallsDelta.filter(
                  newTool =>
                    !accumulatedToolCalls.some(existingTool => existingTool.id === newTool.id)
                );
                accumulatedToolCalls = [...accumulatedToolCalls, ...newToolCalls];

                // If we also have content, it's part of the tool message
                if (content != null) {
                  // Add a space or newline if needed
                  if (accumulatedToolMessage && content.trim()) {
                    // If the last character is not a newline and the new content doesn't start with one
                    if (!accumulatedToolMessage.endsWith('\n') && !content.startsWith('\n')) {
                      // If the last message was a complete sentence, add a newline
                      if (/[.!?]$/.test(accumulatedToolMessage.trim())) {
                        accumulatedToolMessage += '\n';
                      } else {
                        // Otherwise just add a space
                        accumulatedToolMessage += ' ';
                      }
                    }
                  }
                  accumulatedToolMessage += content;

                  const agentMessage: Message = {
                    role: 'agent',
                    content: accumulatedToolMessage,
                    is_tool_message: true,
                    tool_calls: accumulatedToolCalls,
                  };

                  setMessages(prev => {
                    const lastAgentIndex = prev.findLastIndex(
                      msg => msg.role === 'agent' && msg.is_tool_message
                    );

                    // If we have an agent message and it's the last one (after any assistant), update it
                    if (lastAgentIndex !== -1 && lastAgentIndex === prev.length - 1) {
                      const newMessages = [...prev];
                      newMessages[lastAgentIndex] = agentMessage;
                      return newMessages;
                    }

                    // Otherwise append a new agent message
                    return [...prev, agentMessage];
                  });
                }
              } else if (content != null) {
                // If no tool calls in this chunk, it's part of the assistant message
                accumulatedContent += content;

                const assistantMessage: Message = {
                  role: 'assistant',
                  content: accumulatedContent,
                  reasoning: reasoning ? { thinking: accumulatedReasoning } : undefined,
                };

                setMessages(prev => {
                  const lastAssistantIndex = prev.findLastIndex(msg => msg.role === 'assistant');

                  // If we have an assistant message and it's the last one, update it
                  if (lastAssistantIndex !== -1 && lastAssistantIndex === prev.length - 1) {
                    const newMessages = [...prev];
                    newMessages[lastAssistantIndex] = assistantMessage;
                    return newMessages;
                  }

                  // Otherwise append a new assistant message
                  return [...prev, assistantMessage];
                });
              }

              if (reasoningDelta != null) {
                accumulatedReasoning += reasoningDelta;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      setStatus('idle');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setStatus('idle');
          return;
        }
        setError({ message: err.message });
      } else {
        setError({ message: 'An unknown error occurred' });
      }
      setStatus('error');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    await handleChatRequest(input, messages);
    setInput('');
  };

  const reload = async () => {
    if (messages.length > 0 && status !== 'loading') {
      const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user');
      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = messages[lastUserMessageIndex];
        // Keep all messages up to (but not including) the last user message
        const updatedMessages = messages.slice(0, lastUserMessageIndex);
        setMessages(updatedMessages);
        setStatus('loading'); // Set loading state immediately
        await handleChatRequest(lastUserMessage.content, updatedMessages);
      }
    }
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    status,
    stop,
    reload,
    setMessages: clearMessages,
  };
}
