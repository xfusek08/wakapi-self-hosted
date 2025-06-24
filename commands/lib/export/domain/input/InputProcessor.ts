import { InputRepositoryQuery } from './ports/InputRepositoryQuery';
import InputReport from './ports/InputReport';
import InputRecord from './ports/InputRecord';
import { Result } from '../../utils/type-utils';

export default class InputProcessor {
    private constructor(
        private readonly _inputRepositoryQuery: InputRepositoryQuery,
    ) {}

    public static create({
        inputRepositoryQuery,
    }: {
        inputRepositoryQuery: InputRepositoryQuery;
    }): Result<InputProcessor> {
        return Result.ok(new InputProcessor(inputRepositoryQuery));
    }

    public async generateReport({
        from,
        to,
    }: {
        from: Date;
        to: Date;
    }): Promise<Result<InputReport>> {
        return Result.ensure(async () => {
            const projectsResult = await Result.asyncAssert(
                this._inputRepositoryQuery.getProjects({
                    from,
                    to,
                }),
            );

            const allRecords: InputRecord[] = [];
            for (const project of projectsResult) {
                const records = await Result.asyncAssert(
                    this._inputRepositoryQuery.getRecordsForProject(project, {
                        from,
                        to,
                    }),
                );
                allRecords.push(...records);
            }

            allRecords.sort((a, b) => a.from.getTime() - b.from.getTime());

            return {
                from,
                to,
                records: allRecords,
            };
        });
    }
}
