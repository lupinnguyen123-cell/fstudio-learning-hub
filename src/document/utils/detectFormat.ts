import type { DocumentFormat } from '../types'

const extensionFormats: Record<string, DocumentFormat> = { txt: 'txt', md: 'markdown', markdown: 'markdown', pdf: 'pdf', pptx: 'pptx', docx: 'docx' }
const mimeFormats: Record<string, DocumentFormat> = { 'text/plain': 'txt', 'text/markdown': 'markdown', 'application/pdf': 'pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx' }
export function detectDocumentFormat(fileName: string, mimeType = ''): DocumentFormat | null { const extension = fileName.split('.').pop()?.toLowerCase() ?? ''; return extensionFormats[extension] ?? mimeFormats[mimeType.toLowerCase()] ?? null }
