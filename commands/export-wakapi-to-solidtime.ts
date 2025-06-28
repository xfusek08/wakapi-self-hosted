import { defineCommand, log } from 'bunner/framework';

import TimeRange from './lib/export/domain/common/ports/TimeRange';
import InputProcessor from './lib/export/domain/input/InputProcessor';
import OutputProcessor from './lib/export/domain/output/OutputProcessor';
import { Result } from './lib/export/domain/utils/type-utils';
import { WakapiDatabase } from './lib/export/infrastructure/input/wakatime/WakapiDatabase';
import SolidtimeApiConnectionConfiguration from './lib/export/infrastructure/output/solid-time/SolidtimeApiConnectionConfiguration';
import SolidtimeRepositoryMutator from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryMutator';
import SolidtimeRepositoryMutatorMock from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryMutatorMock';
import SolidtimeRepositoryQuery from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryQuery';
import SolidtimeRepositoryQueryMock from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryQueryMock';

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
        Error.stackTraceLimit = 50; // Increase stack trace depth

        const inputRepositoryQuery = WakapiDatabase.create({
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
                    SolidtimeRepositoryQuery.create(configuration),
                err: (error) => {
                    if (!options['dry-run']) {
                        return Result.error(error);
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

        const outputProcessor = OutputProcessor.create({
            outputRepositoryQuery,
            outputRepositoryMutator,
        }).assert();

        log.info('🚀 Starting Wakapi to Solidtime export...\n');

        log.info('📖 Step 1: Reading data from Wakapi database...');
        const report = await Result.asyncAssert(
            inputProcessor.generateReport({
                timeRange: TimeRange.create({
                    from: new Date(options['from']),
                    to: new Date(options['to']),
                }),
            }),
        );
        log.info(
            `✅ Input report generated: ${report.records.length} records found\n`,
        );

        // Step 2: Process report with the output record processor
        log.info('🔄 Step 2: Processing records for Solidtime...');
        await Result.asyncAssert(outputProcessor.processReport(report));

        log.info('\n🎉 Export completed successfully!');
        if (options['dry-run']) {
            console.log(
                'ℹ️  This was a dry run - no actual changes were made to Solidtime.',
            );
        }
    },
});
