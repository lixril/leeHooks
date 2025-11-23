"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * useSmartData - an improved data fetching hook
 * Features:
 * - Supports GET/POST/PUT/DELETE
 * - Optimistic UI updates
 * - Request cancelation
 * - SSR hydration safe
 * - Unified cache layer
 */

const globalCache = new Map();

export function useSmartData(url, options = {}) {
  const {
    method = "GET",
    initialData = null,
    auto = true, // auto-fetch when url changes
    onSuccess,
    onError,
    revalidateOnFocus = true,
  } = options;

  const [data, setData] = useState(() => globalCache.get(url) || initialData);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);

  // Re-fetch logic with AbortController
  const fetchData = useCallback(
    async (body = null, optimisticData = null) => {
      if (!url) return;

      // cancel previous request
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);

      // Optimistic UI
      if (optimisticData !== null) setData(optimisticData);

      try {
        const response = await fetch(url, {
          method,
          body: body ? JSON.stringify(body) : null,
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        // cache update
        globalCache.set(url, result);
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
          onError?.(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [url, method, onSuccess, onError]
  );

  // auto revalidate on mount or url change
  useEffect(() => {
    if (auto && url) fetchData();
    return () => controllerRef.current?.abort();
  }, [url, auto]);

  // optional focus revalidation
  useEffect(() => {
    if (!revalidateOnFocus) return;
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData, revalidateOnFocus]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  const mutate = useCallback(
    async (updater, optimistic) => {
      const prev = data;
      const nextData =
        typeof updater === "function" ? updater(data) : updater;
      setData(optimistic ? nextData : prev);
      try {
        await fetchData(nextData, optimistic ? nextData : null);
      } catch (err) {
        // rollback on error
        if (optimistic) setData(prev);
      }
    },
    [data, fetchData]
  );

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refetch,
      mutate,
      setData,
    }),
    [data, loading, error, refetch, mutate]
  );
}
