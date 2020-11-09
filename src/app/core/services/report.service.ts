import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { NetworkService } from './network.service';
import { StorageService } from './storage.service';
import { switchMap, tap, map, concatMap, reduce, shareReplay, finalize, mergeMap } from 'rxjs/operators';
import { from, range, forkJoin } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiV2Service } from './api-v2.service';
import { DateService } from './date.service';
import { ExtendedReport } from '../models/report.model';
import { OfflineService } from 'src/app/core/services/offline.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private networkService: NetworkService,
    private storageService: StorageService,
    private apiService: ApiService,
    private authService: AuthService,
    private apiv2Service: ApiV2Service,
    private dateService: DateService,
    private offlineService: OfflineService,
  ) { }

  getUserReportParams(state: string) {
    const stateMap = {
      draft: {
        state: ['DRAFT', 'DRAFT_INQUIRY']
      },
      pending: {
        state: ['APPROVER_PENDING']
      },
      inquiry: {
        state: ['APPROVER_INQUIRY']
      },
      approved: {
        state: ['APPROVED']
      },
      payment_queue: {
        state: ['PAYMENT_PENDING']
      },
      paid: {
        state: ['PAID']
      },
      edit: {
        state: ['DRAFT', 'APPROVER_PENDING']
      },
      all: {
        state: ['DRAFT', 'DRAFT_INQUIRY', 'COMPLETE', 'APPROVED', 'APPROVER_PENDING', 'APPROVER_INQUIRY', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAID', 'REJECTED']
      }
    };

    return stateMap[state];
  }

  getPaginatedERptcStats(params) {
    return this.apiService.get('/erpts/stats', { params });
  }

  getPaginatedERptcCount(params) {
    return this.networkService.isOnline().pipe(
      switchMap(
        isOnline => {
          if (isOnline) {
            return this.apiService.get('/erpts/count', { params }).pipe(
              tap((res) => {
                this.storageService.set('erpts-count' + JSON.stringify(params), res);
              })
            );
          } else {
            return from(this.storageService.get('erpts-count' + JSON.stringify(params)));
          }
        }
      )
    );
  }

  getMyReportsCount(queryParams = {}) {
    return this.getMyReports({
      offset: 0,
      limit: 1,
      queryParams
    }).pipe(
      map(res => res.count)
    );
  }

  getMyReports(config: Partial<{ offset: number, limit: number, order: string, queryParams: any }> = {
    offset: 0,
    limit: 10,
    queryParams: {}
  }) {
    return from(this.authService.getEou()).pipe(
      switchMap(eou => {
        return this.apiv2Service.get('/reports', {
          params: {
            offset: config.offset,
            limit: config.limit,
            order: `${config.order || 'rp_created_at.desc'},rp_id.desc`,
            rp_org_user_id: 'eq.' + eou.ou.id,
            ...config.queryParams
          }
        });
      }),
      map(res => res as {
        count: number,
        data: ExtendedReport[],
        limit: number,
        offset: number,
        url: string
      }),
      map(res => ({
        ...res,
        data: res.data.map(this.dateService.fixDates)
      }))
    );
  }

  getTeamReportsCount(queryParams = {}) {
    return this.getTeamReports({
      offset: 0,
      limit: 1,
      queryParams
    }).pipe(
      map(res => res.count)
    );
  }

  getTeamReports(config: Partial<{ offset: number, limit: number, order: string, queryParams: any }> = {
    offset: 0,
    limit: 10,
    queryParams: {}
  }) {

    return from(this.authService.getEou()).pipe(
      switchMap(eou => {
        return this.apiv2Service.get('/reports', {
          params: {
            offset: config.offset,
            limit: config.limit,
            approved_by: 'cs.{' + eou.ou.id + '}',
            order: `${config.order || 'rp_created_at.desc'},rp_id.desc`,
            ...config.queryParams
          }
        });
      }),
      map(res => res as {
        count: number,
        data: ExtendedReport[],
        limit: number,
        offset: number,
        url: string
      }),
      map(res => ({
        ...res,
        data: res.data.map(this.dateService.fixDates)
      }))
    );
  }

  getReport(id: string) {
    return this.getMyReports({
      offset: 0,
      limit: 1,
      queryParams: {
        rp_id: `eq.${id}`
      }
    }).pipe(
      map(
        res => res.data[0]
      )
    );
  }

  getTeamReport(id: string) {
    return this.getTeamReports({
      offset: 0,
      limit: 1,
      queryParams: {
        rp_id: `eq.${id}`
      }
    }).pipe(
      map(
        res => res.data[0]
      )
    );
  }

  actions(rptId: string) {
    return this.apiService.get('/reports/' + rptId + '/actions');
  }

  getExports(rptId: string) {
    return this.apiService.get('/reports/' + rptId + '/exports');
  }

  getApproversByReportId(rptId: string) {
    return this.apiService.get('/reports/' + rptId + '/approvers');
  }

  delete(rptId) {
    return this.apiService.delete('/reports/' + rptId);
  }

  downloadSummaryPdfUrl(data: { report_ids: string[], email: string }) {
    return this.apiService.post('/reports/summary/download', data);
  }


  getAllExtendedReports(config: Partial<{ order: string, queryParams: any }>) {
    return this.getMyReportsCount(config.queryParams).pipe(
      switchMap(count => {
        return range(0, count / 50);
      }),
      concatMap(page => {
        return this.getMyReports({ offset: 50 * page, limit: 50, queryParams: config.queryParams, order: config.order });
      }),
      map(res => res.data),
      reduce((acc, curr) => {
        return acc.concat(curr);
      }, [] as ExtendedReport[])
    );
  }

  getAllOpenReportsCount() {
    return this.getMyReportsCount({
      rp_state: 'in.(DRAFT,APPROVER_PENDING)'
    }).pipe(
      shareReplay()
    );
  }

  getAllTeamExtendedReports(config: Partial<{ order: string, queryParams: any }> = {
    order: '',
    queryParams: {}
  }) {
    return this.getTeamReportsCount().pipe(
      switchMap(count => {
        return range(0, count / 50);
      }),
      concatMap(page => {
        return this.getTeamReports({ offset: 50 * page, limit: 50, ...config.queryParams, order: config.order });
      }),
      map(res => res.data),
      reduce((acc, curr) => {
        return acc.concat(curr);
      }, [] as ExtendedReport[])
    );
  }

  getReportPurpose(reportPurpose) {
    return this.apiService.post('/reports/purpose', reportPurpose).pipe(
      map(res => {
        return res.purpose;
      })
    );
  }

  createDraft(report) {
    return this.apiService.post('/reports', report);
  }

  create(report, txnIds) {
    return this.createDraft(report).pipe(
      switchMap(newReport => {
        return this.apiService.post('/reports/' + newReport.id + '/txns', {ids: txnIds}).pipe(
          switchMap(res => {
            return this.apiService.post('/reports/' + newReport.id + '/submit')
          })
        );
      })
    );
  }

  addTransactions(reportId, txnIds) {
    return this.apiService.post('/reports/' + reportId + '/txns', {
      ids: txnIds
    });
  }

  removeTransaction(rptId, txnId, comment?) {
    var aspy = {
      status: {
        comment
      }
    };
    return this.apiService.post('/reports/' + rptId + '/txns/' + txnId + '/remove', aspy);
  };

}
