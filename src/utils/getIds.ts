// TODO: Add specialized macOS case matching support
import { platform } from "node:os";
import { DOMParser } from "dom";

export default async function getId() {
    // @ts-expect-error: document is not available in Deno
    const isBrowser = typeof globalThis.document !== "undefined";
    const isNotBrowser = !isBrowser;

    if (isNotBrowser) {
        return "unknown|error|2000";
    }

    const ua = globalThis.navigator.userAgent;

    const ids = await getIDsFromSecurlyDomain();

    switch (true) {
        case ua.includes("Chrome/") && isWindows:
            return ids[4];
        case ua.includes("Chrome/") && isChromeOS():
    }
}

function isChromeOS() {
    // @ts-expect-error: document is not available in Deno
    const isBrowser = typeof globalThis.document !== "undefined";
    const isNotBrowser = !isBrowser;

    if (isNotBrowser) {
        return false;
    }

    const ua = globalThis.navigator.userAgent;

    return ua.includes("CrOS");
}
const isWindows = platform() === "win32";

// TODO: Implement non-legacy extension ID fetching on both below functions
export async function getIDsFromSecurlyDomain() {
    const legacyUrl = "https://extensions.securly.com/extensions.xml";

    return await fetch(legacyUrl, { mode: "no-cors" })
        .then((response) => {
            return response.text();
        })
        .then((data) => {
            const mlDoc = new DOMParser().parseFromString(data, "text/xml")
                .querySelector(
                    "gupdate",
                )!.querySelectorAll("app");
            return Array.from(mlDoc).map((app) => {
                // @ts-expect-error: linkedom has a lot of unknowns
                return app.getAttribute("appid");
            });
        });
}

export async function getIDURLVersionFromSecurlyDomain(id: string) {
    const legacyUrl = "https://extensions.securly.com/extensions.xml";

    return await fetch(legacyUrl, { mode: "no-cors" })
        .then((response) => {
            return response.text();
        })
        .then((data) => {
            const mlDoc = new DOMParser().parseFromString(data, "text/xml")
                .querySelector(
                    "gupdate",
                )!.querySelectorAll("app");
            // @ts-expect-error: linkedom has a lot of unknowns
            const app = Array.from(mlDoc).find((app) =>
                app.getAttribute("appid") === id
            );

            if (!app) {
                return null;
            }

            // @ts-expect-error: linkedom has a lot of unknowns
            const updateCheck = app.querySelector("updatecheck");
            return {
                // @ts-expect-error: linkedom has a lot of unknowns
                id: app.getAttribute("appid"),
                version: updateCheck?.getAttribute("version") || "",
                url: updateCheck?.getAttribute("codebase") || "",
            };
        });
}
