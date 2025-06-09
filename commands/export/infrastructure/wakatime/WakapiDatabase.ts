import { InputRepositoryQuery } from 'export/domain/input/InputRepositoryQuery.js';
import { Result } from '../../utils/type-utils.js';
import { Database } from 'bun:sqlite';

export class WakapiDatabase implements InputRepositoryQuery {
    private constructor(private readonly _database: Database) {}

    static create({
        wakapiDbPath,
    }: {
        wakapiDbPath: string;
    }): Result<WakapiDatabase> {
        try {
            const db = new Database(wakapiDbPath, { readonly: true });
            return Result.ok(new WakapiDatabase(db));
        } catch (error) {
            return Result.error(
                `Failed to connect to Wakapi database: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }
}
