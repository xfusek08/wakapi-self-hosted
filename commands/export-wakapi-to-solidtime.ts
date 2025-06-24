import { defineCommand, log } from 'bunner/framework';
import { InputRepositoryQuery } from './lib/export/domain/input/ports/InputRepositoryQuery';
import { WakapiDatabase } from './lib/export/infrastructure/input/wakatime/WakapiDatabase';
import SolidtimeApiConnectionConfiguration from './lib/export/infrastructure/output/solid-time/SolidtimeApiConnectionConfiguration';
import { Result } from './lib/export/utils/type-utils';
import SolidtimeRepositoryQuery from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryQuery';
import SolidtimeRepositoryQueryMock from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryQueryMock';
import SolidtimeRepositoryMutatorMock from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryMutatorMock';
import SolidtimeRepositoryMutator from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryMutator';
import InputProcessor from './lib/export/domain/input/InputProcessor';

export default defineCommand({
    command: 'export-wakapi-to-solidtime',
    description:
        'Exports time tracking data from Wakapi SQLite database to Solidtime using the REST API',
    category: 'backend',
    options: [
        {
            long: 'solidtime-url',
            short: 's',
            description: 'URL of the Solidtime instance to export data to',
            type: 'string',
            required: false,
        },
        {
            long: 'solidtime-key',
            short: 'k',
            description: 'API key for the Solidtime instance',
            type: 'string',
            required: false,
        },
        {
            long: 'solidtime-organization-id',
            short: 'o',
            description: 'ID of the Solidtime organization to export data to',
            type: 'string',
            required: false,
        },
        {
            long: 'wakapi-db-file',
            short: 'f',
            description: 'Path to the Wakapi database file to export from',
            type: 'path',
            required: true,
        },
        {
            long: 'from',
            description: 'Start date for the export in YYYY-MM-DD format',
            type: 'string',
            required: true,
        },
        {
            long: 'to',
            description: 'End date for the export in YYYY-MM-DD format',
            type: 'string',
            required: true,
        },
        {
            long: 'dry-run',
            short: 'd',
            description: 'Run the command without making any changes',
            type: 'boolean',
            default: false,
        },
    ] as const,
    action: async ({ options }) => {
        const inputRepositoryQuery: InputRepositoryQuery =
            WakapiDatabase.create({
                wakapiDbPath: options['wakapi-db-file'],
            }).assert();

        const solidTimeApiConnectionConfiguration =
            SolidtimeApiConnectionConfiguration.create({
                solidtimeUrl: options['solidtime-url'],
                solidtimeApiKey: options['solidtime-key'],
                organizationId: options['solidtime-organization-id'],
            });

        const outputRepositoryQuery = Result.match(
            solidTimeApiConnectionConfiguration,
            {
                ok: (configuration) =>
                    SolidtimeRepositoryQuery.create({ configuration }),
                err: (error) => {
                    if (!options['dry-run']) {
                        error.throw();
                    }
                    return SolidtimeRepositoryQueryMock.create();
                },
            },
        ).assert();

        const outputRepositoryMutator = options['dry-run']
            ? SolidtimeRepositoryMutatorMock.create().assert()
            : SolidtimeRepositoryMutator.create({
                  configuration: solidTimeApiConnectionConfiguration.assert(),
              }).assert();

        const inputProcessor = InputProcessor.create({
            inputRepositoryQuery,
        }).assert();

        const report = await inputProcessor.generateReport({
            from: new Date(options['from']),
            to: new Date(options['to']),
        });

        console.log(report);
    },
});
