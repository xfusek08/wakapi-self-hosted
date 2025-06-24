import { OutputRepositoryMutator } from '../../../domain/output/ports/OutputRepositoryMutator';
import { Result } from '../../../utils/type-utils';

export default class SolidtimeRepositoryMutatorMock
    implements OutputRepositoryMutator
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryMutatorMock> {
        return Result.ok(new SolidtimeRepositoryMutatorMock());
    }
}
