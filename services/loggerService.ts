
export const logger = {
  error: (msg: string, err?: any) => {
    let detail = '';
    
    if (err) {
      if (typeof err === 'string') {
        detail = err;
      } else if (err instanceof Error) {
        detail = `${err.name}: ${err.message}`;
      } else {
        try {
          const message = err.message || err.error_description || err.error?.message;
          if (message) {
            detail = message;
          } else {
            detail = JSON.stringify(err);
          }
        } catch (e) {
          detail = String(err);
        }
      }
    }
    
    console.error(`[ERROR] ${msg} | Details: ${detail}`);
  },
  warn: (msg: string) => {
    console.warn(`[WARN] ${msg}`);
  },
  info: (msg: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${msg}`);
    }
  }
};
