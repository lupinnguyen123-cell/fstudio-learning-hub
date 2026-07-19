let documentCounter = 0
export function documentId(kind: string) { documentCounter += 1; return `doc-${kind}-${Date.now().toString(36)}-${documentCounter}` }
