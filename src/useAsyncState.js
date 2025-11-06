import { useReducer, useCallback, useMemo } from "react";

// --- Constants ---
const Status = Object.freeze({
  IDLE: "idle",
  PENDING: "pending",
  SUCCESS: "success",
  ERROR: "error",
});

const Action = Object.freeze({
  START: "START",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  RESET: "RESET",
});

// --- Reducer ---
const asyncReducer = (state, action) => {
  switch (action.type) {
    case Action.START:
      return { status: Status.PENDING, error: null, data: null };
    case Action.SUCCESS:
      return { status: Status.SUCCESS, error: null, data: action.payload };
    case Action.ERROR:
      return { status: Status.ERROR, error: action.payload, data: null };
    case Action.RESET:
      return { status: Status.IDLE, error: null, data: null };
    default:
      return state;
  }
};

// --- Hook ---
export function useAsyncState(initialStatus = Status.IDLE) {
  const [state, dispatch] = useReducer(asyncReducer, {
    status: initialStatus,
    error: null,
    data: null,
  });

  const { status, error, data } = state;

  // --- Derived State ---
  const isPending = status === Status.PENDING;
  const isError = status === Status.ERROR;
  const isSuccess = status === Status.SUCCESS;

  // --- Async Action Executor ---
  const startAction = useCallback(async (callback) => {
    dispatch({ type: Action.START });

    try {
      const result = await callback();
      dispatch({ type: Action.SUCCESS, payload: result });
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      console.error("Action execution failed:", message);
      dispatch({ type: Action.ERROR, payload: message });
      throw err;
    }
  }, []);

  // --- Reset State ---
  const reset = useCallback(() => {
    dispatch({ type: Action.RESET });
  }, []);

  // --- Conditional Render Components ---
  const RenderPending = useMemo(
    () =>
      function RenderPending({ children }) {
        return isPending ? children : null;
      },
    [isPending]
  );

  const RenderSuccess = useMemo(
    () =>
      function RenderSuccess({ children }) {
        if (!isSuccess || data === null) return null;
        return typeof children === "function" ? children(data) : children;
      },
    [isSuccess, data]
  );

  const RenderError = useMemo(
    () =>
      function RenderError({ children }) {
        if (!isError || !error) return null;
        return typeof children === "function" ? children(error) : children;
      },
    [isError, error]
  );

  // --- New Scalable, Low-Code Renderer Component ---
  const Renderer = useMemo(
    () =>
      function ActionStateRenderer({ idle, pending, success, error: errorProp }) {
        if (isPending) return pending;
        if (isError) return typeof errorProp === "function" ? errorProp(error) : errorProp;
        if (isSuccess && data !== null) return typeof success === "function" ? success(data) : success;
        
        return idle; // Renders idle state by default (or if success/error are null)
      },
    [isPending, isError, isSuccess, data, error]
  );

  // --- Return API ---
  return {
    data,
    error,
    status,
    isPending,
    isError,
    isSuccess,
    
    startAction,
    reset,
    
    // Original granular renders
    RenderPending,
    RenderSuccess,
    RenderError,

    // New unified, low-code renderer for scalability
    Renderer, 
  };
}