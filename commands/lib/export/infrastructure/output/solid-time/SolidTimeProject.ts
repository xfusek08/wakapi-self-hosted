import Project from '../../../domain/common/ports/Project';
import { Result } from '../../../domain/utils/type-utils';

export default class SolidTimeProject implements Project {
    private constructor(private readonly _name: string) {}

    static create(name: string) {
        return new SolidTimeProject(name);
    }

    static parse(data: unknown): Result<SolidTimeProject> {
        return Result.ok(new SolidTimeProject('???'));
    }

    public getIdentifier(): string {
        return this._name;
    }
}
