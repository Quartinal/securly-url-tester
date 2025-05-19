import {
    getIDsFromSecurlyDomain,
    getIDURLVersionFromSecurlyDomain,
} from "./getIds.ts";
import { Promise } from "tspromise";
import { unzipSync } from "fflate";
import paramsBuilder from "./paramsBuilder.ts";

/**
 * This function pings web accessible resources found in a buffered manifest.json file, with heavy usage of the `findWARs` function.
 */
// deno-lint-ignore no-explicit-any
export default async function pingWARs(warArray: any = []) {
}

async function findWARs() {
    return await new Promise<(string | null)[]>((resolve, reject) => {
        getIDsFromSecurlyDomain().then((ids) => {
            resolve(ids);
        }).catch((error) => {
            reject(error);
        });
    }).then((ids) => {
        for (let id of ids) {
            id = id!;

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

            Object.values(idMatchKv).flatMap((hostType) =>
                Object.values(hostType)
            ).forEach(async (id) => {
                const isSecurlyHosted = Object.values(idMatchKv.securlyHosted)
                    .includes(id);

                if (isSecurlyHosted) {
                    await getIDURLVersionFromSecurlyDomain(id).then(
                        async (data) => {
                            const url = data?.url;
                            if (!url) return null;

                            const manifest = await fetch(url, {
                                mode: "no-cors",
                            })
                                .then((res) => {
                                    return res.arrayBuffer();
                                })
                                .then((buffer) => {
                                    const zip = unzipCRX23(buffer);

                                    if (!zip["manifest.json"]) {
                                        throw new Error(
                                            "manifest.json not found in CRX file",
                                        );
                                    }

                                    return new TextDecoder("utf-8").decode(
                                        zip["manifest.json"],
                                    );
                                });

                            const manifestJson: Manifest = JSON.parse(manifest);
                            const war = manifestJson.web_accessible_resources;

                            return war!;
                        },
                    );
                } else {
                    if (id === idMatchKv.cwsHosted.chromebook) {
                    }
                }
            });
        }
    });
}

/**
 * Manifest version 2
 */
interface Manifest {
    web_accessible_resources: string[] | undefined;
}

// TODO: Add case matching for the current non-legacy extension ID
async function fetchFromMea(id: string) {
    if (id !== "dfkheabholbfmmehflddbknjimnjelda") {
        return;
    }

    const urlBase = "https://edge.microsoft.com/extensionwebstorebase/v1/crx";

    const params = paramsBuilder({
        response: "redirect",
        x: `id%3D${id}%26installsource%3Dondemand%26uc`,
    });
    const url = `${urlBase}?${params}`;

    return await fetch(url, { mode: "no-cors" })
        .then((res) => {
            return res.arrayBuffer();
        })
        .then((buffer) => {
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
