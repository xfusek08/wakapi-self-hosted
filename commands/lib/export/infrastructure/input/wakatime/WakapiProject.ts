import InputProject from '../../../domain/input/ports/InputProject.js';
import { Result } from '../../../utils/type-utils.js';

export default class WakapiProject implements InputProject {
    private constructor(private readonly _name: string) {}

    static create(name: string) {
        return new WakapiProject(name);
    }

    getUID(): string {
        return this._name;
    }

    static fromUnknownArray(data: unknown): Result<WakapiProject[]> {
        return Result.ensure(() => {
            if (!Array.isArray(data)) {
                throw new Error('Expected an array');
            }

            const projects: WakapiProject[] = [];

            for (let i = 0; i < data.length; i++) {
                const item = data[i];

                if (!item || typeof item !== 'object') {
                    throw new Error(
                        `Invalid item at index ${i}: expected object`,
                    );
                }

                if (!('project' in item) || typeof item.project !== 'string') {
                    throw new Error(
                        `Invalid item at index ${i}: missing or invalid 'project' property`,
                    );
                }

                projects.push(WakapiProject.create(item.project));
            }

            return projects;
        });
    }
}
