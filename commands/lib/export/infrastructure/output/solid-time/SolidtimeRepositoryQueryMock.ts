import { OutputRepositoryQuery } from 'export/domain/output/ports/OutputRepositoryQuery';
import { Result } from 'export/utils/type-utils';

export default class SolidtimeRepositoryQueryMock
    implements OutputRepositoryQuery
{
    private constructor() {}

    static create(): Result<SolidtimeRepositoryQueryMock> {
        return Result.ok(new SolidtimeRepositoryQueryMock());
    }
}
