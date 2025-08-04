import sanitizeHtml from 'sanitize-html';

const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
    parseStyleAttributes: false,
};

export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
        return '';
    }
    const sanitized = sanitizeHtml(input.trim(), sanitizeOptions);
    return sanitized.replace(/[<>'"]/g, '');
}

export const TASK_VALIDATION = {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[\w\s.,!?-]+$/,
};

export function validateTaskText(text: string): boolean {
    if (typeof text !== 'string') {
        return false;
    }
    const trimmedText = text.trim();
    return (
        trimmedText.length >= TASK_VALIDATION.MIN_LENGTH &&
        trimmedText.length <= TASK_VALIDATION.MAX_LENGTH &&
        TASK_VALIDATION.PATTERN.test(trimmedText)
    );
}
