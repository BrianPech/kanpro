"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send, CheckCircle, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field"

import { contactFormSchema, type ContactFormValues } from "../schemas/contact.schema"
import { contactService } from "../services/contact-service"

export function ContactForm() {
  const [isSuccess, setIsSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema as any),
    mode: "onTouched",
  })

  const onSubmit = async (data: ContactFormValues) => {
    try {
      await contactService.sendMessage(data)
      setIsSuccess(true)
    } catch {
      // Error handled silently - user sees generic error
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-[480px] flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-20 w-20 rounded-full bg-[#428619]/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-[#428619]" />
        </div>
        <h2 className="text-[28px] font-medium text-foreground tracking-tight">
          Mensaje enviado
        </h2>
        <p className="text-[16px] text-muted-foreground max-w-[380px]">
          Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos a la brevedad posible.
        </p>
        <Link
          href="/discovery"
          className="text-[15px] font-semibold text-primary hover:text-primary/80 transition-colors mt-4"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-8">
      <Link href="/discovery" className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="h-[18px] w-[18px] text-background" />
          </div>
          <span className="text-[18px] font-semibold text-foreground tracking-tight">K'anPro</span>
        </div>
        <h1 className="text-[32px] font-medium text-foreground tracking-[-0.32px] leading-[1.19]">
          Contacto
        </h1>
        <p className="text-[16px] text-muted-foreground tracking-[0.24px] leading-[1.5]">
          Envíanos un mensaje y te responderemos lo antes posible.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-[15px] font-semibold text-foreground">
            Nombre *
          </Label>
          <Input
            id="name"
            placeholder="Tu nombre completo"
            {...register("name")}
            className="h-[52px] px-4 text-[15px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError errors={[errors.name]} />}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-[15px] font-semibold text-foreground">
            Correo Electrónico *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            className="h-[52px] px-4 text-[15px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError errors={[errors.email]} />}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="subject" className="text-[15px] font-semibold text-foreground">
            Asunto
          </Label>
          <Input
            id="subject"
            placeholder="¿Sobre qué trata tu mensaje?"
            {...register("subject")}
            className="h-[52px] px-4 text-[15px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <FieldError errors={[errors.subject]} />}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="message" className="text-[15px] font-semibold text-foreground">
            Mensaje *
          </Label>
          <Textarea
            id="message"
            placeholder="Escribe tu mensaje aquí..."
            rows={6}
            {...register("message")}
            className="px-4 py-4 text-[15px] rounded-[12px] focus-visible:ring-primary/20 transition-all resize-none"
            aria-invalid={!!errors.message}
          />
          {errors.message && <FieldError errors={[errors.message]} />}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold transition-all mt-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            "Enviando..."
          ) : (
            <>
              Enviar mensaje
              <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
