import { NextRequest, NextResponse } from "next/server";

interface ApiResponse {
    fileURL?: string;
    message?: string;
}

export async function POST(req: NextRequest) {
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

        const data: ApiResponse = await response.json();
        return NextResponse.json(
            {
                fileURL: data.fileURL,
                message: "Request processed successfully"
            },
            { status: 200 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
