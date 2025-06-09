import { defineCommand, log } from 'bunner/framework';

import { match } from 'export/utils/type-utils';
import { WakapiDatabase } from 'export/infrastructure/wakatime/WakapiDatabase';
import SolidtimeRepositoryQueryMock from 'export/infrastructure/solid-time/SolidtimeRepositoryQueryMock';
import SolidtimeRepositoryQuery from 'export/infrastructure/solid-time/SolidtimeRepositoryQuery';
import SolidtimeApiConnectionConfiguration from 'export/infrastructure/solid-time/SolidtimeApiConnectionConfiguration';
import { InputRepositoryQuery } from 'export/domain/input/InputRepositoryQuery';
import SolidtimeRepositoryMutatorMock from 'export/infrastructure/solid-time/SolidtimeRepositoryMutatorMock';
import SolidtimeRepositoryMutator from 'export/infrastructure/solid-time/SolidtimeRepositoryMutator';

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
            type: 'string',
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
            }).unwrap();

        const solidTimeApiConnectionConfiguration =
            SolidtimeApiConnectionConfiguration.create({
                solidtimeUrl: options['solidtime-url'],
                solidtimeApiKey: options['solidtime-key'],
                organizationId: options['solidtime-organization-id'],
            });

        const outputRepositoryQuery = match(
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
        ).unwrap();

        const outputRepositoryMutator = options['dry-run']
            ? SolidtimeRepositoryMutatorMock.create().unwrap()
            : SolidtimeRepositoryMutator.create({
                  configuration: solidTimeApiConnectionConfiguration.unwrap(),
              }).unwrap();

        const inputReport = (
            await inputRepositoryQuery.generateReport({
                from: new Date(options['from']),
                to: new Date(options['to']),
            })
        ).unwrap();

        const exporter = Exporter.create({
            outputRepositoryQuery,
            outputRepositoryMutator,
        }).unwrap();

        await exporter.exportRecords({
            inputTimeRecords,
        });
    },
});
