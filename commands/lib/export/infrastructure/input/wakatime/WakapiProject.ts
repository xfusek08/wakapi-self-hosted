import { ArkErrors, type } from 'arktype';

import Project from '../../../domain/common/ports/Project.js';
import { Result } from '../../../domain/common/utility-types/Result.js';

export default class WakapiProject implements Project {
    private constructor(
        public readonly name: string,
        public readonly identifier: string,
        public readonly displayName: string,
    ) {}

    static create(name: string) {
        return new WakapiProject(name, name, name);
    }

    static parse(data: unknown): Result<WakapiProject | null> {
        const parseResult = type({ project: 'string' })(data);

        if (parseResult instanceof ArkErrors) {
            return Result.error(
                `Failed to parse WakapiProject: ${parseResult.summary}`,
            );
        }

        return Result.ok(WakapiProject.create(parseResult.project));
    }
}
