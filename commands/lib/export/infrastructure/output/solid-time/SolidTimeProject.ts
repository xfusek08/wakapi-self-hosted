import { type } from 'arktype';

export const SolidTimeProjectType = type({
    id: 'string',
    name: 'string',
    color: 'string',
    client_id: 'string|null',
    is_archived: 'boolean',
}).pipe((data) => ({
    ...data,
    getIdentifier() {
        return this.name;
    },
}));

export type SolidTimeProject = typeof SolidTimeProjectType.infer;
