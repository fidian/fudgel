export class PlaygroundDataService {
    // Returns a Promise
    fromUriString(uriString) {
        if (uriString[0] === '0') {
            return this.fromUriString_0(uriString.slice(1));
        }

        return Promise.resolve('');
    }

    async fromUriString_0(uriString) {
        const decodedString = atob(
            uriString.replace(/-/g, '+').replace(/_/g, '/')
        );
        const decodedBuffer = new Uint8Array(decodedString.length);

        for (let i = 0; i < decodedString.length; i++) {
            decodedBuffer[i] = decodedString.charCodeAt(i);
        }

        const decompressionStream = new DecompressionStream('deflate');
        const decompressedStream = new Blob([decodedBuffer])
            .stream()
            .pipeThrough(decompressionStream);
        return await new Response(decompressedStream).text();
    }

    async toUriString(content) {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(content);
        const compressionStream = new CompressionStream('deflate');
        const compressedStream = new Blob([buffer])
            .stream()
            .pipeThrough(compressionStream);
        const compressedBuffer = await new Response(
            compressedStream
        ).arrayBuffer();
        const base64String = btoa(
            String.fromCharCode(...new Uint8Array(compressedBuffer))
        )
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        return `0${base64String}`;
    }
}
