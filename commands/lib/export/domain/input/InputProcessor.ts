import { InputRepositoryQuery } from './ports/InputRepositoryQuery';
import { Result } from '../../utils/type-utils';
import Report from '../common/ports/Report';
import TimeRecord from '../common/ports/TimeRecord';

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
    }): Promise<Result<Report>> {
        return Result.ensure(async () => {
            const projectsResult = await Result.asyncAssert(
                this._inputRepositoryQuery.getProjects({
                    from,
                    to,
                }),
            );

            console.log('projectsResult', projectsResult);

            const allRecords: TimeRecord[] = [];
            for (const project of projectsResult) {
                const records = await Result.asyncAssert(
                    this._inputRepositoryQuery.getRecordsForProject(project, {
                        from,
                        to,
                    }),
                );
                console.log(project, records);
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
