// deno-lint-ignore-file no-window

import { getIDURLVersionFromSecurlyDomain } from "./getIds.ts";
import { type Unzipped, unzipSync } from "fflate";
import paramsBuilder from "./paramsBuilder.ts";
import { type Err, err, ok } from "nvt";
import readTODOComments from "./readTODOComments.ts";
declare global {
    interface Window {
        _default_error_value: Err<Error, `error: ${string}`>;
        _default_error_message: string;
    }
}

window._default_error_message = "unknown";
window._default_error_value = err(`error: ${window._default_error_message}`);

type WarReturn = Array<
    string[] | { resources: string[]; matches: string[] }[] | null
>;

/**
 * This function pings web accessible resources found in a buffered manifest.json file, with heavy usage of the `findWARs` function.
 */
export default async function pingWARs() {
    const wars = await findWARs();

    const todoFileFormats = readTODOComments().filter(
        (file) => /TODO:\s*Support\s+\.[a-zA-Z]+\b/g.test(file.text),
    );

    if (!todoFileFormats) {
        for (const [, war] of Object.entries(wars)) {
            if (war) {
                const isMV2 = mv2OrMv3FromWARs(war);
                if (isMV2 && isMV2WAR([war])) {
                    const warIsCRXUrl = war.some((item) => {
                        if (typeof item === "string") {
                            return isCRXUrl(item);
                        }
                        return false;
                    });

                    if (warIsCRXUrl) {
                    }
                }
            }
        }
    }

    window._default_error_message = "there are todo formats";
    return window._default_error_value;
}

async function findWARs(): Promise<WarReturn> {
    const idMatchKv = {
        securlyHosted: {
            chromebook: "joflmkccibkooplaeoinecjbmdebglab",
            chrome: "lcgajdcbmhepemmlpemkkpgagieehmjp",
            edge: "adncfiefnfjddkdlfcckejoefaoehcdf",
        },
        cwsHosted: {
            chromebook: "iheobagjkfklnlikgihanlhcddjoihkg",
        },
        meaHosted: {
            edge: "dfkheabholbfmmehflddbknjimnjelda",
        },
    };

    // Create a flat array of all extension IDs to check
    const extensionIds = Object.values(idMatchKv).flatMap((hostType) =>
        Object.values(hostType)
    );

    // Map all IDs to promises that resolve to their WAR data
    const warPromises = extensionIds.map(async (id) => {
        const isSecurlyHosted = Object.values(idMatchKv.securlyHosted).includes(
            id,
        );

        if (isSecurlyHosted) {
            const data = await getIDURLVersionFromSecurlyDomain(id);
            const url = data?.url;
            if (!url) return null;

            try {
                const buffer = await fetch(url, { mode: "no-cors" }).then(
                    (res) => res.arrayBuffer(),
                );
                const zip = unzipCRX23(buffer);

                const manifest = getManifest(zip);

                if (manifest) {
                    return manifest.isOk()
                        ? manifest.value.web_accessible_resources || null
                        : null;
                }
                return null;
            } catch (error) {
                console.error("Error processing Securly extension:", error);
                return null;
            }
        } else {
            const manifest = await fetchFromMeaCws(id);
            if (manifest) {
                return manifest.isOk()
                    ? manifest.value.web_accessible_resources || null
                    : null;
            }
            return null;
        }
    });

    // Wait for all WAR data to be collected
    return await Promise.all(warPromises);
}

/**
 * Manifest version 2
 */
interface Manifest {
    web_accessible_resources:
        | string[]
        | undefined
        | Array<{ resources: string[]; matches: string[] }>;
}

// TODO: Add case matching for the current non-legacy extension ID
async function fetchFromMeaCws(id: string) {
    if (
        id !== "dfkheabholbfmmehflddbknjimnjelda" &&
        id !== "iheobagjkfklnlikgihanlhcddjoihkg"
    ) {
        return;
    }

    const urlBase = id === "dfkheabholbfmmehflddbknjimnjelda"
        ? "https://edge.microsoft.com/extensionwebstorebase/v1/crx"
        : "https://clients2.google.com/service/update2/crx";

    const params = paramsBuilder({
        response: "redirect",
        x: `id%3D${id}%26installsource%3Dondemand%26uc`,
    });
    const url = `${urlBase}?${params}`;

    window._default_error_message = "no manifest found";

    return await fetch(url, { mode: "no-cors" })
        .then((res) => {
            return res.arrayBuffer();
        })
        .then((buffer) => {
            const zip = unzipCRX23(buffer);

            const manifest = getManifest(zip);

            return manifest.mapErr(() => window._default_error_value.error);
        })
        .catch(() => {
            return window._default_error_value;
        });
}

function unzipCRX23(buffer: ArrayBuffer) {
    const crxData = new Uint8Array(buffer);

    const magic = new TextDecoder().decode(crxData.slice(0, 4));
    if (magic !== "Cr24" && magic !== "Cr3\0") {
        throw new Error("Invalid CRX format");
    }

    let offset = 0;

    if (magic === "Cr24") {
        const publicKeyLength = crxData[8] | (crxData[9] << 8) |
            (crxData[10] << 16) | (crxData[11] << 24);
        const signatureLength = crxData[12] | (crxData[13] << 8) |
            (crxData[14] << 16) | (crxData[15] << 24);
        offset = 16 + publicKeyLength + signatureLength;
    } else {
        const headerSize = crxData[8] | (crxData[9] << 8) |
            (crxData[10] << 16) | (crxData[11] << 24);
        offset = 12 + headerSize;
    }

    const zipData = crxData.slice(offset);
    return unzipSync(zipData, {
        filter: (file) => file.name === "manifest.json",
    });
}

function getManifest(unzipped: Unzipped) {
    if (!unzipped["manifest.json"]) {
        return err<Manifest, Error>(
            new Error("manifest.json not found in unzipped file"),
        );
    }

    try {
        const manifestText = new TextDecoder("utf-8").decode(
            unzipped["manifest.json"],
        );
        const manifestJson = JSON.parse(manifestText);
        return ok<Manifest, Error>(manifestJson);
    } catch (error) {
        return err<Manifest, Error>(
            new Error(
                `Failed to parse manifest.json: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            ),
        );
    }
}

function mv2OrMv3FromWARs(
    war: string[] | { resources: string[]; matches: string[] }[] | null,
): boolean {
    if (!war || war.length === 0) return true;

    for (const item of war) {
        if (typeof item === "object") {
            return false;
        }
    }

    return true;
}

function isCRXUrl(url: string): boolean {
    return /^chrome-extension:\/\/[a-z]{32}(?:\/.*?(?:\.[a-zA-Z0-9]+)?)?$/.test(
        url,
    );
}

function isMV2WAR(
    war:
        | WarReturn
        | (string[] | { resources: string[]; matches: string[] }[])[],
): boolean {
    for (const items of war) {
        if (!items) continue;

        for (const warItem of items) {
            if (typeof warItem === "object") {
                return false;
            }
        }
    }

    return true;
}
