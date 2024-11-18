import { CoreMessage } from 'ai';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { Chat as PreviewChat } from '@/components/custom/chat';
import { getChatById, getMessagesByChatId } from '@/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import getSession from "@/lib/getSession";

export default async function Page({
                                       params,
                                   }: {
    params: Promise<{ id: string }>
}) {
    const session = await getSession();

    if (!session || !session.user) {
        notFound();
    }

    const { id } = await params;

    const chat = await getChatById({ id });

    if (!chat) {
        notFound();
    }

    const messagesFromDb = await getMessagesByChatId({
        id,
    });

    console.log(messagesFromDb);

    const cookieStore = await cookies();
    const modelIdFromCookie = cookieStore.get('model-id')?.value;
    const selectedModelId =
        models.find((model) => model.id === modelIdFromCookie)?.id ||
        DEFAULT_MODEL_NAME;

    return (
        <PreviewChat
            id={id}
            reportId={chat.reportId}
            initialMessages={convertToUIMessages(messagesFromDb)}
            selectedModelId={selectedModelId}
        />
    );
}
