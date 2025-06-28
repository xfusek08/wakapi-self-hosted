import { ArkErrors, type } from 'arktype';

import Project from '../../../domain/common/ports/Project.js';
import { Result } from '../../../domain/utils/type-utils.js';

export default class WakapiProject implements Project {
    private constructor(private readonly _name: string) {}

    static create(name: string) {
        return new WakapiProject(name);
    }

    static parse(data: unknown): Result<WakapiProject> {
        const parseResult = type({
            project: 'string',
        })(data);

        if (parseResult instanceof ArkErrors) {
            return Result.error(
                `Failed to parse WakapiProject: ${parseResult.summary}`,
            );
        }

        return Result.ok(new WakapiProject(parseResult.project));
    }

    public get name(): string {
        return this._name;
    }

    public getIdentifier(): string {
        return this.name;
    }
}
