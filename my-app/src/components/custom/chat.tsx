'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/custom/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { Vote } from '@/db/schema';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';

export function Chat({
                         id,
                         initialMessages,
                         selectedModelId,
                     }: {
    id: string;
    initialMessages: Array<Message>;
    selectedModelId: string;
}) {
    const { mutate } = useSWRConfig();

    const {
        messages,
        setMessages,
        handleSubmit,
        input,
        setInput,
        append,
        isLoading,
        stop,
    } = useChat({
        body: { id, modelId: selectedModelId },
        initialMessages,
        onFinish: () => {
            mutate('/api/history');
        },
    });

    const { data: votes } = useSWR<Array<Vote>>(
        `/api/vote?chatId=${id}`,
        fetcher
    );

    const [messagesContainerRef, messagesEndRef] =
        useScrollToBottom<HTMLDivElement>();

    const [attachments, setAttachments] = useState<Array<Attachment>>([]);

    return (
        <>
            <div className="flex flex-col min-w-0 h-dvh bg-background">
                <ChatHeader selectedModelId={selectedModelId} />
                <div
                    ref={messagesContainerRef}
                    className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
                >
                    {messages.length === 0 && <Overview />}

                    {messages.map((message, index) => (
                        <PreviewMessage
                            key={message.id}
                            chatId={id}
                            message={message}
                            isLoading={isLoading && messages.length - 1 === index}
                            vote={
                                votes
                                    ? votes.find((vote) => vote.messageId === message.id)
                                    : undefined
                            }
                        />
                    ))}

                    {isLoading &&
                        messages.length > 0 &&
                        messages[messages.length - 1].role === 'user' && (
                            <ThinkingMessage />
                        )}

                    <div
                        ref={messagesEndRef}
                        className="shrink-0 min-w-[24px] min-h-[24px]"
                    />
                </div>
                <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
                    <MultimodalInput
                        chatId={id}
                        input={input}
                        setInput={setInput}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        stop={stop}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        messages={messages}
                        setMessages={setMessages}
                        append={append}
                    />
                </form>
            </div>
        </>
    );
}