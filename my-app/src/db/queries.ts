'server-only';

import { and, asc, desc, eq, gt } from 'drizzle-orm';

import {
    users,
    chat,
    document,
    Suggestion,
    suggestion,
    Message,
    message,
    vote,
} from './schema';

import { db } from "@/db/drizzle"

export async function saveChat({
                                   id,
                                   reportId,
                                   userId,
                                   title,
                               }: {
    id: string;
    reportId: string;
    userId: string;
    title: string;
}) {
    try {
        return await db.insert(chat).values({
            id,
            reportId,
            createdAt: new Date(),
            userId,
            title,
        });
    } catch (error) {
        console.error('Failed to save chat in database');
        throw error;
    }
}

export async function deleteChatById({ id }: { id: string }) {
    try {
        await db.delete(vote).where(eq(vote.chatId, id));
        await db.delete(message).where(eq(message.chatId, id));

        return await db.delete(chat).where(eq(chat.id, id));
    } catch (error) {
        console.error('Failed to delete chat by id from database');
        throw error;
    }
}

export async function getChatsByUserId({ id }: { id: string }) {
    try {
        return await db
            .select()
            .from(chat)
            .where(eq(chat.userId, id))
            .orderBy(desc(chat.createdAt));
    } catch (error) {
        console.error('Failed to get chats by user from database');
        throw error;
    }
}

export async function getChatById({ id }: { id: string }) {
    try {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
        return selectedChat;
    } catch (error) {
        console.error('Failed to get chat by id from database');
        throw error;
    }
}

export async function getChatByReportIdAndUserId({ reportId, userId }: { reportId: string; userId: string }) {
    try {
        const [selectedChat] = await db
            .select()
            .from(chat)
            .where(and(eq(chat.reportId, reportId), eq(chat.userId, userId)));
        return selectedChat;
    } catch (error) {
        console.error('Failed to get chat by reportId and userId from database');
        throw error;
    }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
    try {
        return await db.insert(message).values(messages);
    } catch (error) {
        console.error('Failed to save messages in database', error);
        throw error;
    }
}

export async function getMessagesByChatId({ id }: { id: string }) {
    try {
        return await db
            .select()
            .from(message)
            .where(eq(message.chatId, id))
            .orderBy(asc(message.createdAt));
    } catch (error) {
        console.error('Failed to get messages by chat id from database', error);
        throw error;
    }
}

export async function voteMessage({
                                      chatId,
                                      messageId,
                                      type,
                                  }: {
    chatId: string;
    messageId: string;
    type: 'up' | 'down';
}) {
    try {
        const [existingVote] = await db
            .select()
            .from(vote)
            .where(and(eq(vote.messageId, messageId)));

        if (existingVote) {
            return await db
                .update(vote)
                .set({ isUpvoted: type === 'up' ? true : false })
                .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
        } else {
            return await db.insert(vote).values({
                chatId,
                messageId,
                isUpvoted: type === 'up' ? true : false,
            });
        }
    } catch (error) {
        console.error('Failed to upvote message in database', error);
        throw error;
    }
}

export async function getVotesByChatId({ id }: { id: string }) {
    try {
        return await db.select().from(vote).where(eq(vote.chatId, id));
    } catch (error) {
        console.error('Failed to get votes by chat id from database', error);
        throw error;
    }
}
