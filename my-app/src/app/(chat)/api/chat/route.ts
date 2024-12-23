import {
    convertToCoreMessages,
    Message,
    StreamData,
    streamText,
} from 'ai';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { systemPrompt } from '@/ai/prompts';
import getSession from "@/lib/getSession";
import {
    deleteChatById,
    getChatById,
    saveMessages,
} from '@/db/queries';
import {
    generateUUID,
    getMostRecentUserMessage,
    sanitizeResponseMessages,
} from '@/lib/utils';

export const maxDuration = 60;

export async function POST(request: Request) {
    const {
        id,
        messages,
        modelId,
    }: { id: string; messages: Array<Message>; modelId: string } =
        await request.json();

    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const model = models.find((model) => model.id === modelId);

    if (!model) {
        return new Response('Model not found', { status: 404 });
    }

    const coreMessages = convertToCoreMessages(messages);

    const userMessage = getMostRecentUserMessage(coreMessages);

    if (!userMessage) {
        return new Response('No user message found', { status: 400 });
    }

    console.log(messages);

    console.log(coreMessages);

    await saveMessages({
        messages: [
            {
                ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id,
            },
        ],
    });

    const streamingData = new StreamData();

    const result = await streamText({
        model: customModel(model.apiIdentifier),
        system: systemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        onFinish: async ({ responseMessages }) => {
            if (session.user && session.user.id) {
                try {
                    /*
                    await saveChat({
                        id,
                        messages: [...coreMessages, ...responseMessages],
                        userId: session.user.id,
                    });
                    */
                    const responseMessagesWithoutIncompleteToolCalls =
                        sanitizeResponseMessages(responseMessages);

                    console.log(responseMessagesWithoutIncompleteToolCalls);

                    await saveMessages({
                        messages: responseMessagesWithoutIncompleteToolCalls.map(
                            (message) => {
                                const messageId = generateUUID();

                                return {
                                    id: messageId,
                                    chatId: id,
                                    role: message.role,
                                    content: message.content,
                                    createdAt: new Date(),
                                };
                            }
                        ),
                    });
                } catch (_) {
                    console.error('Failed to save chat');
                }
            }
            await streamingData.close();
        },
        experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
        },
    });

    return result.toDataStreamResponse({
        data: streamingData,
    });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return new Response('Not Found', { status: 404 });
    }

    const session = await getSession();

    if (!session || !session.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const chat = await getChatById({ id });

        if (chat.userId !== session.user.id) {
            return new Response('Unauthorized', { status: 401 });
        }

        await deleteChatById({ id });

        return new Response('Chat deleted', { status: 200 });
    } catch (_) {
        return new Response('An error occurred while processing your request', {
            status: 500,
        });
    }
}
