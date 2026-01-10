export class UrlService {
    resolve(relativePath, basePath = document.baseURI) {
        return new URL(relativePath, basePath).toString();
    }
}
