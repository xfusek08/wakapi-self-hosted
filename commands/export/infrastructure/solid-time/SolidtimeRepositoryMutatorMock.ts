import { Result } from 'export/utils/type-utils';
import { OutputRepositoryMutator } from 'export/domain/output/OutputRepositoryMutator';

export default class SolidtimeRepositoryMutatorMock
    implements OutputRepositoryMutator
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryMutatorMock> {
        return Result.ok(new SolidtimeRepositoryMutatorMock());
    }
}
