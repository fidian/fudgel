import { entries, stringify } from './util';

export interface RequestArgs {
    body?: any;
    deserialize?: (data: any) => any;
    headers?: RequestHeaders | Map<string,string>;
    method?: string; // Converted to uppercase, default is GET
    password?: string;
    responseType?: string;
    serialize?: (data: any) => string;
    timeout?: number; // Timeout in milliseconds
    url: string;
    user?: string;
    withCredentials?: boolean;
}

export interface RequestHeaders {
    [key: string]: string;
}

const toUpperCase = (x: string) => x.toUpperCase();

const makeError = (message: string, code: number, response?: any) => {
    const err = new Error(message) as any;
    err.code = code;
    err.response = response;

    return err;
};

export const request = <T = any>(args: RequestArgs): Promise<T> => {
    return new Promise((resolve, reject) => {
        const headers = new Map([
            ['CONTENT-TYPE', 'application/json; charset=utf8'],
            ['ACCEPT', 'application/json, text/*'],
        ]);

        for (const entry of entries(args.headers || {})) {
            headers.set(toUpperCase(entry[0]), entry[1]);
        }

        const assignArgToXhr = (name: string, defaultValue?: any) =>
            ((xhr as any)[name] = (args as any)[name] || defaultValue);
        let isTimeout = false;
        const xhr = new XMLHttpRequest();
        xhr.open(
            toUpperCase(args.method || 'GET'),
            args.url,
            true,
            args.user,
            args.password
        );
        assignArgToXhr('responseType', 'json');
        assignArgToXhr('withCredentials');
        assignArgToXhr('timeout');

        for (const entry in headers) {
            xhr.setRequestHeader(entry[0], entry[1]);
        }

        xhr.onreadystatechange = event => {
            const target = event.target as any;

            if (target.readyState === 4) {
                try {
                    let response = target.response;

                    if (args.deserialize) {
                        response = args.deserialize(response);
                    }

                    if (target.status >= 200 && target.status < 300) {
                        resolve(response);
                    } else {
                        // ontimeout fires after onreadystatechange
                        setTimeout(() => {
                            if (!isTimeout) {
                                try {
                                    response = target.responseText;
                                } catch (ignore) {}

                                reject(
                                    makeError(response, target.status, response)
                                );
                            }
                        });
                    }
                } catch (e) {
                    reject(e);
                }
            }
        };
        xhr.ontimeout = event => {
            isTimeout = true;
            reject(makeError('Timeout', (event.target as any).status));
        };

        xhr.send((args.serialize || stringify)(args.body));
    });
};
