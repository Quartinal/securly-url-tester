//deno-lint-ignore-file
import { crextnBaseUrl } from "../index.ts";

export default function isSiteAllowed(url: string, userEmail: string) {
    const notAllowedIndicators = ["DENY", "PAUSE"];
    const allowedIndicator = "ALLOW";

    const host = new URL(url).host;
    const b64Url = btoa(url);

    const queryParamKv = {
        "url": b64Url,
        "email": userEmail,
        "host": host,
        "reason": "crextn",
    };
}
