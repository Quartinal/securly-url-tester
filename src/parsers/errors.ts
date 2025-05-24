/*export default function parseError(error: string) {
    const sides = error.split("|");

    const noExtensionId = sides[0] === "unknown";
    const isError = sides[1] === "error";
    const errorCode = sides[2];

    if (isError && noExtensionId) {
        console.log("Error: code", errorCode);
        console.log("No extension ID was found either.");
    }
}*/
