import { OutputRepositoryQuery } from 'export/domain/output/ports/OutputRepositoryQuery';
import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';
import { Result } from 'export/utils/type-utils';

export default class SolidtimeRepositoryQuery implements OutputRepositoryQuery {
    private constructor(
        private readonly _configuration: SolidtimeApiConnectionConfiguration,
    ) {}

    static create({
        configuration,
    }: {
        configuration: SolidtimeApiConnectionConfiguration;
    }): Result<SolidtimeRepositoryQuery> {
        return Result.ok(new SolidtimeRepositoryQuery(configuration));
    }
}
