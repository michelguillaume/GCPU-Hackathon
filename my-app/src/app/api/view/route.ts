import {NextRequest, NextResponse} from "next/server";
import {getChatById, getChatByReportIdAndUserId, saveChat, saveMessages} from "@/db/queries";
import {generateUUID} from "@/lib/utils";
import getSession from "@/lib/getSession";


export async function POST(req: NextRequest) {
    const session = await getSession();

    if (!session || !session.user || !session.user.id) {
        return new Response('Unauthorized', {status: 401});
    }

    const requestData = await req.json();
    const { reportId, filingUrl, accessionNo, companyName, filedAt, formType, ticker } = requestData;

    if (!reportId || !filingUrl) {
        return NextResponse.json(
            { error: "Missing reportId or filingUrl parameter" },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`http://localhost:8080/api/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filingId: reportId,
                filingUrl,
                accessionNo,
                companyName,
                filedAt,
                formType,
                ticker
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Error from Go API: ${errorText}` },
                { status: response.status }
            );
        }

        const goApiResponse = await response.json();
        const fileURL = goApiResponse.fileURL;

        if (!fileURL) {
            return NextResponse.json(
                { error: "The Go API did not return a file URL" },
                { status: 500 }
            );
        }

        const existingChat = await getChatByReportIdAndUserId({
            reportId,
            userId: session.user.id,
        });

        let chatId;

        if (!existingChat) {
            const chatTitle = `${companyName} - ${formType} - ${filedAt}`;
            chatId = generateUUID();

            await saveChat({
                id: chatId,
                reportId,
                userId: session.user.id,
                title: chatTitle,
            });
        } else {
            chatId = existingChat.id;
        }

        return NextResponse.json(
            {
                message: "Request processed successfully",
                fileURL: fileURL,
                chatId: chatId,
            },
            { status: 200 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
