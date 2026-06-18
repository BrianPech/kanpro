"use client";

import * as React from "react";
import { getVacanciesByLocation } from "../services/get-vacancies-by-location";
import type { Job } from "@/modules/discovery/types";

export function useVacanciesFeed(initialJobs: Job[]) {
  const [search, setSearch] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [modality, setModality] = React.useState("");

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [debouncedLocation, setDebouncedLocation] = React.useState("");

  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [loading, setLoading] = React.useState(false);

  // Debounce search query (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Debounce location query (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location);
    }, 300);
    return () => clearTimeout(handler);
  }, [location]);

  // Fetch vacancies from Server Action when debounced query values change
  React.useEffect(() => {
    let active = true;

    async function fetchJobs() {
      setLoading(true);
      try {
        const results = await getVacanciesByLocation(debouncedSearch, debouncedLocation);
        if (active) {
          setJobs(results);
        }
      } catch (error) {
        console.error("Error fetching debounced vacancies in hook:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchJobs();

    return () => {
      active = false;
    };
  }, [debouncedSearch, debouncedLocation]);

  // Client-side filtering for modality and category
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      // Category / Sector Filter
      if (category) {
        if (job.category.toLowerCase().trim() !== category.toLowerCase().trim()) {
          return false;
        }
      }

      // Modality / Modalidad Filter
      if (modality) {
        const modalityLower = modality.toLowerCase();
        const locationLower = job.location.toLowerCase();
        const typeLower = job.type.toLowerCase();

        if (modalityLower === "remoto") {
          const isRemote =
            locationLower.includes("remote") ||
            locationLower.includes("remoto") ||
            typeLower.includes("remote") ||
            typeLower.includes("remoto");
          if (!isRemote) return false;
        } else if (modalityLower === "híbrido" || modalityLower === "hibrido") {
          const isHybrid =
            locationLower.includes("hybrid") ||
            locationLower.includes("híbrid") ||
            locationLower.includes("hibrid") ||
            typeLower.includes("hybrid") ||
            typeLower.includes("híbrid") ||
            typeLower.includes("hibrid");
          if (!isHybrid) return false;
        } else if (modalityLower === "presencial") {
          const isRemote =
            locationLower.includes("remote") ||
            locationLower.includes("remoto") ||
            typeLower.includes("remote") ||
            typeLower.includes("remoto");
          const isHybrid =
            locationLower.includes("hybrid") ||
            locationLower.includes("híbrid") ||
            locationLower.includes("hibrid") ||
            typeLower.includes("hybrid") ||
            typeLower.includes("híbrid") ||
            typeLower.includes("hibrid");
          if (isRemote || isHybrid) return false;
        }
      }

      return true;
    });
  }, [jobs, category, modality]);

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
    jobs: filteredJobs,
    loading,
    handleClearFilters,
    hasActiveFilters: !!(search || location || category || modality),
  };
}
