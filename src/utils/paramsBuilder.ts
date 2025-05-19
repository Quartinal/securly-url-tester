export default function paramsBuilder(params: Record<string, string>) {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    return queryString;
}
