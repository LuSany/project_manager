import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;
