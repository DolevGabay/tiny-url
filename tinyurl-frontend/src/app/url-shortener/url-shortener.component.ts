import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UrlService } from '../services/url.service';

@Component({
  selector: 'app-url-shortener',
  templateUrl: './url-shortener.component.html',
  imports: [CommonModule, HttpClientModule],
  styleUrls: ['./url-shortener.component.css'],
  standalone: true,
})
export class UrlShortenerComponent {
  shortUrl: string = '';

  constructor(private urlService: UrlService) {}

  shortenUrl(longUrl: string) {
    console.log(longUrl);
    this.urlService.shortenUrl(longUrl).subscribe((response) => {
      this.shortUrl = `http://localhost:5001/${response.shortUrl}`;
    });
  }
}
