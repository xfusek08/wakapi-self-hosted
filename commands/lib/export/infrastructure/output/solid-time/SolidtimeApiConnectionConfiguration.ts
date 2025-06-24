import { Result } from '../../../domain/utils/type-utils.js';

export default class SolidtimeApiConnectionConfiguration {
    private constructor(
        public readonly solidtimeUrl: string,
        public readonly solidtimeApiKey: string,
        public readonly organizationId: string,
    ) {}

    static create({
        solidtimeUrl,
        solidtimeApiKey,
        organizationId,
    }: {
        solidtimeUrl?: string;
        solidtimeApiKey?: string;
        organizationId?: string;
    }): Result<SolidtimeApiConnectionConfiguration> {
        if (solidtimeUrl && solidtimeApiKey && organizationId) {
            return Result.ok(
                new SolidtimeApiConnectionConfiguration(
                    solidtimeUrl,
                    solidtimeApiKey,
                    organizationId,
                ),
            );
        }

        const errors = [];
        if (!solidtimeUrl) {
            errors.push('Solidtime URL is required');
        }

        if (!solidtimeApiKey) {
            errors.push('Solidtime API key is required');
        }

        if (!organizationId) {
            errors.push('Solidtime organization ID is required');
        }

        return Result.error(errors);
    }
}
