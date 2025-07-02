import { defineCommand, log } from 'bunner/framework';

import { reportPrintToString } from './lib/export/domain/common/ports/Report';
import TimeRange from './lib/export/domain/common/utility-classes/TimeRange';
import { Result } from './lib/export/domain/common/utility-types/Result';
import InputProcessor from './lib/export/domain/input/InputProcessor';
import OutputProcessor from './lib/export/domain/output/OutputProcessor';
import { WakapiDatabase } from './lib/export/infrastructure/input/wakatime/WakapiDatabase';
import SolidtimeApi from './lib/export/infrastructure/output/solid-time/SolidtimeApi';
import SolidtimeRepository from './lib/export/infrastructure/output/solid-time/SolidtimeRepository';
import SolidtimeRepositoryMutatorMock from './lib/export/infrastructure/output/solid-time/SolidtimeRepositoryMutatorMock';

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
            long: 'solidtime-member-id',
            short: 'm',
            description: 'ID of the Solidtime member to export data to',
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
        {
            long: 'print-input',
            short: 'p',
            description: 'Print the input report to the console',
            type: 'boolean',
            default: false,
        },
    ] as const,
    action: async ({ options }) => {
        Error.stackTraceLimit = 50; // Increase stack trace depth

        const inputRepositoryQuery = WakapiDatabase.create({
            wakapiDbPath: options['wakapi-db-file'],
        }).assert();

        const solidTimeApi = SolidtimeApi.create({
            solidtimeUrl: options['solidtime-url'],
            solidtimeApiKey: options['solidtime-key'],
            organizationId: options['solidtime-organization-id'],
            memberId: options['solidtime-member-id'],
        }).assert();

        const outputRepository =
            SolidtimeRepository.create(solidTimeApi).assert();

        const outputRepositoryMutator = options['dry-run']
            ? SolidtimeRepositoryMutatorMock.create().assert()
            : outputRepository;

        const inputProcessor = InputProcessor.create({
            inputRepositoryQuery,
        }).assert();

        const outputProcessor = OutputProcessor.create({
            outputRepositoryQuery: outputRepository,
            outputRepositoryMutator,
        }).assert();

        log.info('🚀 Starting Wakapi to Solidtime export...\n');

        log.info('📖 Step 1: Reading data from Wakapi database...');
        const report = await Result.asyncAssert(
            inputProcessor.generateReport(
                TimeRange.create({
                    from: new Date(options['from']),
                    to: new Date(options['to']),
                }),
            ),
        );
        log.info(
            `✅ Input report generated: ${report.entries.length} records found\n`,
        );

        if (options['print-input']) {
            console.log(reportPrintToString(report));
            return;
        }

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
