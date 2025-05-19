import getId from "./getIds.ts";

export default async function getLatestSecurlyVer() {
    const fetchBase = "https://www.crx4chrome.com/crx-url.php";
    return await fetch(fetchBase + ``);
}
