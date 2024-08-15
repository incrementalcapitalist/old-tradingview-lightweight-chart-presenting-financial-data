/**
 * @fileoverview Lambda function to fetch historical stock data from Polygon.io
 * @author Incremental Capitalist
 */

import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Interface for the query string parameters
 * @interface QueryStringParams
 * @property {string} symbol - The stock symbol to fetch data for
 * @property {string} [page] - The page number for pagination
 */
interface QueryStringParams {
  symbol: string;
  page?: string;
}

/**
 * Interface for the Polygon.io API response
 * @interface PolygonResponse
 * @property {string} status - The status of the API response
 * @property {Array<StockData>} results - The array of stock data points
 */
interface PolygonResponse {
  status: string;
  results: StockData[];
}

/**
 * Interface for individual stock data points
 * @interface StockData
 * @property {number} t - The timestamp of the data point
 * @property {number} o - The opening price
 * @property {number} h - The highest price
 * @property {number} l - The lowest price
 * @property {number} c - The closing price
 * @property {number} v - The trading volume
 */
interface StockData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/**
 * Lambda function handler to fetch historical stock data
 * @param {APIGatewayProxyEvent} event - The API Gateway event object
 * @returns {Promise<APIGatewayProxyResult>} The API Gateway response object
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Extract query parameters from the event
  const params = event.queryStringParameters as QueryStringParams;
  const symbol = params.symbol || 'AAPL';
  const page = parseInt(params.page || '1', 10);

  // Set up date range (2 years from current date)
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 2);

  // Set up pagination
  const limit = 100;
  const offset = (page - 1) * limit;

  // Construct the Polygon.io API URL
  const apiKey = process.env.POLYGON_API_KEY;
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from.toISOString().split('T')[0]}/${to.toISOString().split('T')[0]}?apiKey=${apiKey}&sort=asc&limit=${limit}&offset=${offset}`;

  try {
    // Fetch data from Polygon.io
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: PolygonResponse = await response.json();

    // Return the successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Enable CORS for all origins
      },
      body: JSON.stringify({
        status: 'success',
        data: data.results,
        page: page,
        hasMore: data.results.length === limit,
      }),
    };
  } catch (error) {
    // Log the error and return an error response
    console.error('Error fetching stock data:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Enable CORS for all origins
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Failed to fetch stock data',
      }),
    };
  }
};