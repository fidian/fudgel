import { CachingFetchService } from './caching-fetch-service.js';
import { di } from './fudgel.min.js';
import { UrlService } from './url-service.js';

export class SampleService {
    cachingFetchService = di(CachingFetchService);
    urlService = di(UrlService);

    async getSample(url) {
        const resolvedUrl = this.urlService.resolve(url);
        const content = await this.cachingFetchService.fetchText(resolvedUrl);
        const type = resolvedUrl.split('.').pop();

        return {
            content,
            type
        };
    }
}
