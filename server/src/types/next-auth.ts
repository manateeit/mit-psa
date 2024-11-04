import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        username: string;
        proToken: string;
        tenant?: string;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            username: string;
            image?: string;
            proToken: string;
            tenant?: string;
        };
    }

    interface JWT {
        id: string;
        email: string;
        name: string;
        username: string;
        image: string;
        proToken: string;
        tenant?: string;
    }
}
