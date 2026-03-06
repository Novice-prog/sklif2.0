import type {
  BulkUpsertPayload,
  ComparativeAnalyticsItem,
  ComparativeAnalyticsRequest,
  ControlPointDTO,
  DiagnosisRecordDTO,
  DiseaseDTO,
  GroupAnalyticsItem,
  GroupAnalyticsRequest,
  LabResultDTO,
  MedicalCaseDTO,
} from './contracts';
import { HttpClient } from './httpClient';

export interface ClinicalDataApi {
  getMedicalCases(): Promise<MedicalCaseDTO[]>;
  getDiseases(): Promise<DiseaseDTO[]>;
  getControlPoints(): Promise<ControlPointDTO[]>;
  getLabResults(): Promise<LabResultDTO[]>;
  getDiagnosisRecords(): Promise<DiagnosisRecordDTO[]>;
  bulkUpsert(payload: BulkUpsertPayload): Promise<void>;
  getGroupAnalytics(payload: GroupAnalyticsRequest): Promise<GroupAnalyticsItem[]>;
  getComparativeAnalytics(payload: ComparativeAnalyticsRequest): Promise<ComparativeAnalyticsItem[]>;
}

const PAGE_LIMIT = 2000;

export class HttpClinicalDataApi implements ClinicalDataApi {
  constructor(private readonly http: HttpClient) {}

  getMedicalCases(): Promise<MedicalCaseDTO[]> {
    return this.fetchAllPages<MedicalCaseDTO>('/api/v1/medical-cases');
  }

  getDiseases(): Promise<DiseaseDTO[]> {
    return this.fetchAllPages<DiseaseDTO>('/api/v1/diseases');
  }

  getControlPoints(): Promise<ControlPointDTO[]> {
    return this.fetchAllPages<ControlPointDTO>('/api/v1/control-points');
  }

  getLabResults(): Promise<LabResultDTO[]> {
    return this.fetchAllPages<LabResultDTO>('/api/v1/lab-results');
  }

  getDiagnosisRecords(): Promise<DiagnosisRecordDTO[]> {
    return this.fetchAllPages<DiagnosisRecordDTO>('/api/v1/diagnosis-records');
  }

  async bulkUpsert(payload: BulkUpsertPayload): Promise<void> {
    await this.http.post('/api/v1/clinical-data/bulk-upsert', payload);
  }

  getGroupAnalytics(payload: GroupAnalyticsRequest): Promise<GroupAnalyticsItem[]> {
    return this.http.post('/api/v1/analytics/group', payload);
  }

  getComparativeAnalytics(payload: ComparativeAnalyticsRequest): Promise<ComparativeAnalyticsItem[]> {
    return this.http.post('/api/v1/analytics/comparative', payload);
  }

  private async fetchAllPages<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    let offset = 0;

    while (true) {
      const page = await this.http.get<T[]>(`${path}?offset=${offset}&limit=${PAGE_LIMIT}`);
      items.push(...page);
      if (page.length < PAGE_LIMIT) {
        return items;
      }
      offset += PAGE_LIMIT;
    }
  }
}

export const createClinicalDataApi = (): ClinicalDataApi => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const http = new HttpClient({
    baseUrl,
    getAccessToken: () => sessionStorage.getItem('access_token'),
  });
  return new HttpClinicalDataApi(http);
};

