export interface urlSchema {
  user:string,
  repo:string,
  file:string
}

export const cdnURL = ({user,repo,file}:urlSchema) =>`https://cdn.jsdelivr.net/gh/${user}/${repo}/${file}`;


export async function to<T, U = Error> (
  promise: Promise<T>,
  errorExt?: object
): Promise<[U | null, T | undefined]> {
  try {
    const data = await promise;
    const result: [null, T] = [null, data];
    return result;
  } catch (err) {
    if (errorExt) {
      Object.assign(err, errorExt);
    }
    const result_1: [U, undefined] = [err, undefined];
    return result_1;
  }
}