export const css = (strings: readonly string[], ...values: any[]) =>
    String.raw({ raw: strings }, ...values);

export const html = css;
