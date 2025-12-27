export const throwError = (message: string): never => {
    const error = new Error(message);
    console.error(error);
    throw error;
}
