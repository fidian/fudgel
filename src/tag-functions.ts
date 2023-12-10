export const html = (strings: string[], ...values: any[]) =>
    String.raw({ raw: strings }, ...values);
export const css = html;
