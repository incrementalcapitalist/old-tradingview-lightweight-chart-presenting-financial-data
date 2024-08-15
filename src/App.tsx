/**
 * @fileoverview React component to display historical stock data
 * @author Incremental Capitalist
 */

import React, { useState, useEffect, useRef } from 'react';
import { API } from 'aws-amplify';
import { createChart, IChartApi } from 'lightweight-charts';

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
 * Main App component
 * @returns {JSX.Element} The rendered App component
 */
const App: React.FC = () => {
  // State variables
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Ref for the chart container
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  /**
   * Fetch stock data from the API
   * @param {number} pageNum - The page number to fetch
   * @param {boolean} append - Whether to append the new data or replace existing data
   */
  const fetchData = async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      const response = await API.get('stockApi', '/stock', { 
        queryStringParameters: { symbol, page: pageNum.toString() } 
      });
      
      if (append) {
        setData(prevData => [...prevData, ...response.data]);
      } else {
        setData(response.data);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchData(1);
  }, [symbol]);

  // Create and update chart when data changes
  useEffect(() => {
    if (chartContainerRef.current && data.length > 0) {
      if (!chartRef.current) {
        chartRef.current = createChart(chartContainerRef.current, {
          width: 600,
          height: 300,
        });
      }

      const candlestickSeries = chartRef.current.addCandlestickSeries();
      candlestickSeries.setData(data.map(d => ({
        time: d.t / 1000, // Convert milliseconds to seconds
        open: d.o,
        high: d.h,
        low: d.l,
        close: d.c,
      })));
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data]);

  /**
   * Handle symbol input change
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event
   */
  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(event.target.value.toUpperCase());
  };

  /**
   * Handle form submission
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchData(1);
  };

  /**
   * Load more data
   */
  const loadMore = () => {
    if (hasMore) {
      fetchData(page + 1, true);
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Stock Data</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={symbol}
          onChange={handleSymbolChange}
          placeholder="Enter stock symbol"
        />
        <button type="submit">Fetch Data</button>
      </form>
      <div ref={chartContainerRef} />
      {loading && <div>Loading...</div>}
      {hasMore && !loading && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
};

export default App;