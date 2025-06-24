import InputProject from './InputProject';
import InputRecord from './InputRecord';
import { Result } from '../../../utils/type-utils';

export interface InputRepositoryQuery {
    getProjects(range: {
        from: Date;
        to: Date;
    }): Promise<Result<InputProject[]>>;

    getRecordsForProject<P extends InputProject = InputProject>(
        project: P,
        range: { from: Date; to: Date },
    ): Promise<Result<InputRecord<P>[]>>;
}
