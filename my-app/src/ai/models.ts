export interface Model {
    id: string;
    label: string;
    apiIdentifier: string;
    description: string;
}

export const models: Array<Model> = [
    {
        id: 'gemini-1.5-flash-002',
        label: 'Gemini 1.5 Flash',
        apiIdentifier: 'gemini-1.5-flash-002',
        description: 'Lightweight models, two variants, both optimized for speed and efficiency',
    },
    {
        id: 'gemini-1.5-pro-002',
        label: 'Gemini 1.5 Pro',
        apiIdentifier: 'gemini-1.5-pro-002',
        description: 'Our best model for general performance across a wide range of tasks',
    },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gemini-1.5-flash-002';
