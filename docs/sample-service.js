import { CachingFetchService } from './caching-fetch-service.js';
import { di } from './fudgel.min.js';
import { UrlService } from './url-service.js';

export class SampleService {
    cachingFetchService = di(CachingFetchService);
    urlService = di(UrlService);

    async getSample(sampleUrl) {
        const metaUrl = this.urlService.resolve(sampleUrl);
        const meta = await this.cachingFetchService.fetchJson(metaUrl);

        const sourceUrl = this.urlService.resolve(meta.source, metaUrl);
        const content = await this.cachingFetchService.fetchText(sourceUrl);

        return {
            meta,
            content,
        };
    }
}
