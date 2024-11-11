export function getDocumentDownloadUrl(file_id: string): string {
    if (!file_id) return '#';
    return `/api/documents/download/${file_id}`;
}
