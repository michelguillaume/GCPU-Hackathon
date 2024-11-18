// app/actions/fetchData.ts

export interface Filing {
    ticker: string;
    formType: string;
    accessionNo: string;
    cik: string;
    companyNameLong: string;
    companyName: string;
    linkToFilingDetails: string;
    description: string;
    linkToTxt: string;
    filedAt: string;
    id: string;
}

export interface ApiResponse {
    total: {
        value: number;
        relation: string;
    };
    filings: Filing[];
}


//export async function fetchData(
//    page = 0,
//     pageSize = 20
// ): Promise<ApiResponse> {
//     const response = await fetch("https://api.sec-api.io/", {
//         method: "POST",
//         headers: {
//             "Accept": "application/json, text/plain, */*",
//             "Content-Type": "application/json;charset=UTF-8"
//         },
//         body: JSON.stringify({
//             query: "formType:*",
//             from: page * pageSize,
//             size: pageSize,
//             sort: [{ filedAt: { order: "desc" } }]
//         })
//     });
//
//     if (!response.ok) {
//         throw new Error("Failed to fetch data");
//     }
//
//     const data = await response.json();
//     return data as ApiResponse;
// }

type FetchDataParams = {
    page?: number;
    pageSize?: number;
    ticker?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    formType?: string;
    excludeFormTypes?: string[];
};

export async function fetchData({
                                    page = 0,
                                    pageSize = 20,
                                    ticker = "",
                                    companyName = "",
                                    startDate = "",
                                    endDate = "",
                                    excludeFormTypes = [],
                                }: FetchDataParams): Promise<ApiResponse> {
    const filters: string[] = [];

    if (ticker) {
        filters.push(`ticker:(${ticker})`);
    }
    if (companyName) {
        filters.push(`companyName:(${companyName})`);
    }
    if (startDate && endDate) {
        filters.push(`filedAt:[${startDate} TO ${endDate}]`);
    }
    if (excludeFormTypes.length > 0) {
        filters.push(`NOT formType:(${excludeFormTypes.join(",")})`);
    }

    const query = filters.length > 0 ? filters.join(" AND ") : "formType:*";

    console.log(query);

    const response = await fetch("https://api.sec-api.io/", {
        method: "POST",
        headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
            query,
            from: page * pageSize,
            size: pageSize,
            sort: [{ filedAt: { order: "desc" } }],
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data = await response.json();
    return data as ApiResponse;
}

