// src/app/services/url.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private apiUrl = 'http://localhost:5001/api/shorten';

  constructor(private http: HttpClient) {}

  shortenUrl(longUrl: string): Observable<any> {
    return this.http.post(this.apiUrl, { longUrl });
  }
}
