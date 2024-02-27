/**
 * Handles errors and returns a rejected promise with the error object.
 * @param {unknown} error - The error object.
 * @returns {Promise<never>} - A rejected promise with the error object.
 */
function errorHandler(error: unknown): Promise<never> {
  let errorObj: Error;

  if (error instanceof Error) {
    errorObj = error;
  } else {
    errorObj = new Error(String(error));
  }

  return new Promise((resolve, reject) => {
    console.error("An error occurred:", errorObj.message);
    reject(errorObj);
  });
}

export default errorHandler;
