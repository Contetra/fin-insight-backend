import { Response } from 'express';

interface ResponseTypes<T = unknown> {
  data?: T[];
  message: string;
  code?: number;
  errorDetail?: unknown;
}

const istDate = new Date();
istDate.setMinutes(istDate.getMinutes() + 330);

export const istCurrDate = new Date(istDate);

export const sendError = (res: Response, { data = [], message, code = 400 }: ResponseTypes) => {
  const response = {
    status: false,
    statusCode: code,
    data: data,
    message: message,
  };

  res.status(code).json(response);
};

export const getDateCurr = () => {
  // Create a date in IST timezone
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
};

export const sendCatchError = (res: Response, { data = [], message, code = 400, errorDetail }: ResponseTypes) => {
  // const errorInfo = errorDetail instanceof Error ? { message: errorDetail.message } : errorDetail;
console.log("errorDetail",errorDetail);
  const response = {
    status: false,
    statusCode: code,
    data: data,
    message: message,
    // error: errorInfo ?? null,
  };

  res.status(code).json(response);
};

export const sendSuccess = (res: Response, { data = [], message, code = 200 }: ResponseTypes) => {
  const response = {
    status: true,
    statusCode: code,
    data: data,
    message: message,
  };

  res.status(code).json(response);
};

/**
 * Generates a random transaction ID with customizable prefix and length
 * @param {string} prefix - Optional prefix for the transaction ID (default: 'TXN')
 * @param {number} length - Length of the random part of the ID (default: 10)
 * @returns {string} A unique transaction ID
 */
export const generateTransactionId = (prefix: string = 'TXN', length: number = 10): string => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2, 2 + length);
  return `${prefix}_${timestamp}_${randomPart}`.toUpperCase();
};
