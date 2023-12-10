export const html = (strings: readonly string[], ...values: any[]) =>
    String.raw({ raw: strings }, ...values);
export const css = html;
