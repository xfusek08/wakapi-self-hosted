import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';
import { Result } from 'export/utils/type-utils';
import { OutputRepositoryMutator } from 'export/domain/output/ports/OutputRepositoryMutator';

export default class SolidtimeRepositoryMutator
    implements OutputRepositoryMutator
{
    private constructor(
        private readonly _configuration: SolidtimeApiConnectionConfiguration,
    ) {}

    static create({
        configuration,
    }: {
        configuration: SolidtimeApiConnectionConfiguration;
    }): Result<SolidtimeRepositoryMutator> {
        return Result.ok(new SolidtimeRepositoryMutator(configuration));
    }
}
