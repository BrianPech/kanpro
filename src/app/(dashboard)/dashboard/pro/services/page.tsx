import { ServicesManager } from "@/modules/pro/components/services-manager"
import { getProServices } from "@/modules/pro/services/pro-dashboard"

export default async function ServicesPage() {
  const data = await getProServices()

  if (!data) return null

  const { services, userId } = data


  return (
    <div className="flex flex-col gap-8 pb-16 max-w-[1000px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 mt-6 md:mt-10 px-4 md:px-8">
        <h1 className="text-[28px] md:text-[36px] font-semibold tracking-tight leading-none">
          Mis Servicios
        </h1>
        <p className="text-[16px] text-muted-foreground">
          Crea, edita y gestiona los servicios que ofreces a las empresas.
        </p>
      </div>

      <div className="px-4 md:px-8">
        <ServicesManager initialServices={services || []} userId={userId} />
      </div>
    </div>
  )
}
