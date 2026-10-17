import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockCreateSignedUrl = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === "applications") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "app-123",
                    candidate_id: "candidate-456",
                    vacancies: {
                      company_id: "company-1",
                      recruiter_id: "company-1",
                    },
                  },
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                maybeSingle: mockMaybeSingle,
              })),
            })),
          })),
        })),
      };
    }),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  })),
}));

describe("Candidate CV Document Retrieval & Security (getCandidateCvDocument)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns hasUploadedCv: false when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    const { getCandidateCvDocument } = await import("@/modules/company/actions/document-access");
    const result = await getCandidateCvDocument("app-123", "candidate-456");

    expect(result).toEqual({
      hasUploadedCv: false,
      cvUrl: null,
      fileName: null,
      uploadedAt: null,
    });
  });

  test("returns uploaded CV when user is authenticated and direct document exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "company-1" } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "doc-1",
        doc_type: "cv",
        file_name: "Curriculum_Alex_Buckmaster.pdf",
        file_url: "https://storage.kanpro.com/cv.pdf",
        created_at: "2026-09-01T10:00:00Z",
      },
      error: null,
    });

    const { getCandidateCvDocument } = await import("@/modules/company/actions/document-access");
    const result = await getCandidateCvDocument("app-123", "candidate-456");

    expect(result.hasUploadedCv).toBe(true);
    expect(result.fileName).toBe("Curriculum_Alex_Buckmaster.pdf");
    expect(result.cvUrl).toBe("https://storage.kanpro.com/cv.pdf");
  });

  test("handles storage paths by generating signed URLs", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "company-1" } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "doc-2",
        doc_type: "cv",
        file_name: "Resume.pdf",
        file_url: "candidate-456/cv_1788292_Resume.pdf",
        created_at: "2026-09-02T12:00:00Z",
      },
      error: null,
    });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.url/Resume.pdf" },
      error: null,
    });

    const { getCandidateCvDocument } = await import("@/modules/company/actions/document-access");
    const result = await getCandidateCvDocument("app-123", "candidate-456");

    expect(result.hasUploadedCv).toBe(true);
    expect(result.cvUrl).toBe("https://signed.url/Resume.pdf");
    expect(result.fileName).toBe("Resume.pdf");
  });
});
