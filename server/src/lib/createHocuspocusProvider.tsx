import { HocuspocusProvider } from "@hocuspocus/provider";

const HOCUSPOCUS_URL = process.env.HOCUSPOCUS_HOST || 'localhost';

// Connect it to the backend
export function createHocuspocusProvider(document : string): HocuspocusProvider {
    return new HocuspocusProvider({
                                    url: HOCUSPOCUS_URL,
                                    name: "tiptap-test",
                                    });
}
