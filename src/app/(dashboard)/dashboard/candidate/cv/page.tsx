import { redirect } from "next/navigation";

export default function UploadCvPage() {
  redirect("/dashboard/candidate/documents");
}
