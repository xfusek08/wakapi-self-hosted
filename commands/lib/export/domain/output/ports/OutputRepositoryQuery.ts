import { Result } from '../../../utils/type-utils';
import Project from '../../common/ports/Project';

export interface OutputRepositoryQuery {
    getProjects(): Promise<Result<Project[]>>;
    getProjectByName(name: string): Promise<Result<Project | null>>;
}
