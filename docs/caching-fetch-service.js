import { di } from './fudgel.min.js';
import { UrlService } from './url-service.js';

export class CachingFetchService {
    cache = new Map();
    urlService = di(UrlService);

    async fetchText(url) {
        const resolvedUrl = this.urlService.resolve(url);

        if (this.cache.has(resolvedUrl)) {
            return this.cache.get(resolvedUrl);
        }

        const response = await fetch(resolvedUrl);
        const content = await response.text();
        this.cache.set(resolvedUrl, content);

        return content;
    }

    async fetchJson(url) {
        return JSON.parse(await this.fetchText(url));
    }
}
