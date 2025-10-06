import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';

const NotGiven = Symbol('NotGiven');

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  private _status: BehaviorSubject<Record<string, any>> | undefined;

  init_status(status_record: Record<string, any>): void {
    if (this._status) {
      throw new Error('StatusService has already been initialized.');
    }
    this._status = new BehaviorSubject(status_record);
  }

  get status(): Record<string, any> {
    if (!this._status) {
      throw new Error('StatusService has not been initialized yet.');
    }
    return JSON.parse(JSON.stringify(this._status.getValue()));
  }

  get_status$(path?: string): Observable<Record<string, any>> {
    const source$ = this._status!.asObservable();

    if (!path) {
      return source$;
    }

    return source$.pipe(
      map((status: Record<string, any>) =>
        this._get_patch_value_bypath(status, path)
      ),
      distinctUntilChanged((prev, curr) =>
        typeof prev === 'object' && typeof curr === 'object'
          ? JSON.stringify(prev) === JSON.stringify(curr)
          : prev === curr
      )
    );
  }

  get_status_list(path?: string): Record<string, any>[] {
    const full_status_list = Object.entries(this.status).map(
      ([key, value]) => ({
        [key]: value,
      })
    );

    if (!path) {
      return full_status_list;
    }

    const record = this._get_patch_value_bypath(this.status, path);
    if (typeof record === 'object') {
      return Object.entries(
        this._get_patch_value_bypath(this.status, path)
      ).map(([key, value]) => ({
        [key]: value,
      }));
    } else {
      return [];
    }
  }

  patch_status(path: string, patch_value: any) {
    const new_status = { ...this.status };
    this._get_patch_value_bypath(new_status, path, patch_value);
    if (JSON.stringify(new_status) !== JSON.stringify(this.status)) {
      this._status?.next(new_status);
    }
  }

  get_status_snapshot(path: string): any | undefined {
    return this._get_patch_value_bypath({ ...this.status }, path);
  }

  private _get_patch_value_bypath(
    status_record: Record<string, any>,
    path: string,
    updated_Status: any = NotGiven
  ): any | undefined {
    if (typeof path !== 'string') throw new Error('invalid path string.');
    if (!status_record) return undefined;

    const paths = path.split('.');
    const str = paths.shift();
    // Handle invalid path or missing property, return undefined directly
    if (!str || !status_record.hasOwnProperty(str)) {
      return undefined;
    }
    // If the path is not yet complete, recursively process the next level
    if (paths.length > 0 && status_record[str]) {
      return this._get_patch_value_bypath(
        status_record[str],
        paths.join('.'),
        updated_Status
      );
    }
    // If there is an update status, handle the update logic
    if (updated_Status === NotGiven) {
      return status_record[str];
    }
    // update logic
    if (!updated_Status || Object.keys(updated_Status).length === 0) {
      delete status_record[str];
    } else if (
      typeof status_record[str] === 'object' &&
      typeof updated_Status === 'object'
    ) {
      status_record[str] = { ...status_record[str], ...updated_Status };
    } else {
      status_record[str] = updated_Status;
    }
  }
}
