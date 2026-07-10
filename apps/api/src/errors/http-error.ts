import type { ValidationIssue } from '@caddisfly/core';

export interface HttpErrorResponse {
    error: string;
    issues?: ValidationIssue[];
}

export class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly issues?: ValidationIssue[]
    ) {
        super(message);
        this.name = 'HttpError';
    }

    toResponse(): HttpErrorResponse {
        const response: HttpErrorResponse = { error: this.message };
        if (this.issues) {
            response.issues = this.issues;
        }
        return response;
    }
}