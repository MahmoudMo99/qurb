import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  robots?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly siteName = 'قُرب | Qurb';
  private readonly baseUrl = 'https://qurb-islamic.vercel.app';

  update(options: SeoOptions): void {
    const canonicalUrl = this.getCanonicalUrl(options.path);
    const robots = options.robots ?? 'index, follow';

    this.titleService.setTitle(options.title);

    this.setMetaName('description', options.description);
    this.setMetaName('robots', robots);
    this.setMetaName('author', 'Mahmoud Mohamed');
    this.setMetaName('theme-color', '#0f3d2e');

    this.setMetaProperty('og:site_name', this.siteName);
    this.setMetaProperty('og:type', 'website');
    this.setMetaProperty('og:title', options.title);
    this.setMetaProperty('og:description', options.description);
    this.setMetaProperty('og:url', canonicalUrl);
    this.setMetaProperty('og:locale', 'ar_EG');

    this.setMetaName('twitter:card', 'summary');
    this.setMetaName('twitter:title', options.title);
    this.setMetaName('twitter:description', options.description);

    this.setCanonicalUrl(canonicalUrl);
    this.setJsonLd(options.description);
  }

  private setMetaName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }

  private setMetaProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }

  private getCanonicalUrl(path: string): string {
    const cleanPath = path.split('?')[0].split('#')[0];
    const normalizedPath = !cleanPath || cleanPath === '/' ? '/home' : cleanPath;

    return `${this.baseUrl}${normalizedPath}`;
  }

  private setCanonicalUrl(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setJsonLd(description: string): void {
    const scriptId = 'qurb-jsonld';
    let script = this.document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = this.document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'قُرب',
      alternateName: ['Qurb', 'قرب'],
      url: this.baseUrl,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      inLanguage: 'ar',
      description,
      creator: {
        '@type': 'Person',
        name: 'Mahmoud Mohamed',
        url: 'https://mahmoud-mohamed-portfolio.vercel.app',
      },
    });
  }
}
