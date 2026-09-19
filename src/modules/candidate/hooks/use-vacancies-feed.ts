"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { getVacanciesByLocation } from "../services/get-vacancies-by-location";
import type { Job } from "@/modules/discovery/types";

export function useVacanciesFeed(initialJobs: Job[] = []) {
  const [search, setSearch] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [modality, setModality] = React.useState("");

  // Declarative input debouncing using @tanstack/react-pacer (300ms)
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const [debouncedLocation] = useDebouncedValue(location, { wait: 300 });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["vacancies", { search: debouncedSearch, location: debouncedLocation, category, modality }],
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 10;
      const results = await getVacanciesByLocation(
        debouncedSearch,
        debouncedLocation,
        category,
        modality,
        pageParam as number,
        PAGE_SIZE
      );
      return {
        jobs: results,
        nextPage: results.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const jobs = React.useMemo(() => {
    if (!data) return initialJobs;
    const fetchedJobs = data.pages.flatMap((page) => page.jobs);
    return fetchedJobs.length > 0 ? fetchedJobs : (debouncedSearch || debouncedLocation || category || modality ? [] : initialJobs);
  }, [data, initialJobs, debouncedSearch, debouncedLocation, category, modality]);

  const handleClearFilters = () => {
    setSearch("");
    setLocation("");
    setCategory("");
    setModality("");
  };

  return {
    search,
    setSearch,
    location,
    setLocation,
    category,
    setCategory,
    modality,
    setModality,
    jobs,
    loading: isLoading || isFetching,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    handleClearFilters,
    hasActiveFilters: !!(search || location || category || modality),
  };
}
