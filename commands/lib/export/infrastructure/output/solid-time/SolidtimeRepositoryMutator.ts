import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';
import { Result } from '../../../utils/type-utils';
import SolidtimeApiConnectionConfiguration from './SolidtimeApiConnectionConfiguration';

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
