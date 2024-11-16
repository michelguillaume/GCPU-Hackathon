import { createServerActionProcedure } from "zsa";
import getSession from "@/lib/getSession";

const authedProcedure = createServerActionProcedure()
    .handler(async () => {
        const session = await getSession();

        if (!session || !session.user) {
            throw new Error("User not authenticated");
        }

        return {
            user: {
                id: session?.user.id,
            },
        }
    })

export default authedProcedure;
