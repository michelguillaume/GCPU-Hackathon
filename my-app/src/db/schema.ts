import {
    boolean,
    timestamp,
    pgTable,
    text,
    primaryKey,
    integer,
    varchar,
    json,
    uuid,
    foreignKey,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"
import {InferSelectModel} from "drizzle-orm";

export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
})

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
)

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
)

export const authenticators = pgTable(
    "authenticator",
    {
        credentialID: text("credentialID").notNull().unique(),
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        providerAccountId: text("providerAccountId").notNull(),
        credentialPublicKey: text("credentialPublicKey").notNull(),
        counter: integer("counter").notNull(),
        credentialDeviceType: text("credentialDeviceType").notNull(),
        credentialBackedUp: boolean("credentialBackedUp").notNull(),
        transports: text("transports"),
    },
    (authenticator) => ({
        compositePK: primaryKey({
            columns: [authenticator.userId, authenticator.credentialID],
        }),
    })
)



export const chat = pgTable('Chat', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    reportId: text('reportId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    userId: text('userId')
        .notNull()
        .references(() => users.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chatId')
        .notNull()
        .references(() => chat.id),
    role: varchar('role').notNull(),
    content: json('content').notNull(),
    createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
    'Vote',
    {
        chatId: uuid('chatId')
            .notNull()
            .references(() => chat.id),
        messageId: uuid('messageId')
            .notNull()
            .references(() => message.id),
        isUpvoted: boolean('isUpvoted').notNull(),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.chatId, table.messageId] }),
        };
    }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
    'Document',
    {
        id: uuid('id').notNull().defaultRandom(),
        createdAt: timestamp('createdAt').notNull(),
        title: text('title').notNull(),
        content: text('content'),
        userId: text('userId')
            .notNull()
            .references(() => users.id),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.id, table.createdAt] }),
        };
    }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
    'Suggestion',
    {
        id: uuid('id').notNull().defaultRandom(),
        documentId: uuid('documentId').notNull(),
        documentCreatedAt: timestamp('documentCreatedAt').notNull(),
        originalText: text('originalText').notNull(),
        suggestedText: text('suggestedText').notNull(),
        description: text('description'),
        isResolved: boolean('isResolved').notNull().default(false),
        userId: text('userId')
            .notNull()
            .references(() => users.id),
        createdAt: timestamp('createdAt').notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.id] }),
        documentRef: foreignKey({
            columns: [table.documentId, table.documentCreatedAt],
            foreignColumns: [document.id, document.createdAt],
        }),
    })
);

export type Suggestion = InferSelectModel<typeof suggestion>;
