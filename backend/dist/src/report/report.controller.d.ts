import { ReportService } from './report.service';
import type { Response } from 'express';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getEventReport(eventId: string, res: Response): Promise<void>;
}
