import * as React from "react";
import { getImpersonationState } from "@/lib/auth/impersonation";
import { ImpersonationBanner } from "./impersonation-banner";

interface ImpersonationProviderProps {
  children: React.ReactNode;
}

export async function ImpersonationProvider({
  children,
}: ImpersonationProviderProps) {
  const impersonationState = await getImpersonationState();

  return (
    <>
      {impersonationState.isImpersonating && (
        <ImpersonationBanner
          targetUserName={impersonationState.targetUserName}
          targetUserEmail={impersonationState.targetUserEmail}
          targetUserRole={impersonationState.targetUserRole}
        />
      )}
      {children}
    </>
  );
}
