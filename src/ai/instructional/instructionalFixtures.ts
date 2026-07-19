let counter = 0
export const instructionalId = (kind: string) => { counter += 1; return `ig-${kind}-${Date.now().toString(36)}-${counter}` }
