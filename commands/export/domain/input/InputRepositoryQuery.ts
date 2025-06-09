import { Result } from 'export/utils/type-utils';
import InputReport from './InputReport';

export interface InputRepositoryQuery {
    generateReport(range: {
        from: Date;
        to: Date;
    }): Promise<Result<InputReport>>;
}
