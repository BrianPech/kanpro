import { describe, expect, test } from "vitest";
import {
  buildCandidateSearchUrl,
  parseCandidateSearchParams,
} from "@/modules/candidate/utils/search-params";

describe("Candidate mobile search sheet URL helpers", () => {
  test("buildCandidateSearchUrl omits empty params and default modality", () => {
    expect(
      buildCandidateSearchUrl({ q: "  ", location: "", modality: "all" })
    ).toBe("/dashboard/candidate");
  });

  test("buildCandidateSearchUrl serializes query, location, and modality", () => {
    expect(
      buildCandidateSearchUrl({
        q: "Recepcionista",
        location: "Cancún, Quintana Roo",
        modality: "presencial",
      })
    ).toBe(
      "/dashboard/candidate?q=Recepcionista&location=Canc%C3%BAn%2C+Quintana+Roo&modality=presencial"
    );
  });

  test("parseCandidateSearchParams normalizes valid values and falls back on invalid modality", () => {
    expect(
      parseCandidateSearchParams({
        q: " Auxiliar administrativo ",
        location: "Cancún",
        modality: "REMOTO",
      })
    ).toEqual({
      q: "Auxiliar administrativo",
      location: "Cancún",
      modality: "remoto",
    });

    expect(
      parseCandidateSearchParams({
        modality: "invalida",
      })
    ).toEqual({
      q: "",
      location: "",
      modality: "all",
    });
  });
});
