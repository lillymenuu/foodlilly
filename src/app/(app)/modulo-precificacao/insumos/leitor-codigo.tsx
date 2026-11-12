"use client";

import { useEffect, useRef, useState } from "react";
import { ScanBarcode, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/** API do navegador para ler códigos (Chrome/Edge/Android). Não existe no Safari. */
type Detector = { detect: (fonte: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type ConstrutorDetector = new (opcoes: { formats: string[] }) => Detector;

export const leitorDisponivel = () => typeof window !== "undefined" && "BarcodeDetector" in window;

/** Mostra a câmera traseira e devolve o primeiro código de barras lido. */
export function LeitorCodigo({
  onLido,
  onFechar,
}: {
  onLido: (codigo: string) => void;
  onFechar: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string>();
  // Mantém as funções mais recentes sem reiniciar a câmera.
  const callbacks = useRef({ onLido, onFechar });
  useEffect(() => {
    callbacks.current = { onLido, onFechar };
  });

  useEffect(() => {
    let ativo = true;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function iniciar() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!ativo || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();

        const BarcodeDetector = (window as unknown as { BarcodeDetector: ConstrutorDetector }).BarcodeDetector;
        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });

        const procurar = async () => {
          if (!ativo || !video.current) return;
          try {
            const [codigo] = await detector.detect(video.current);
            if (codigo?.rawValue) {
              callbacks.current.onLido(codigo.rawValue);
              return;
            }
          } catch {
            // Quadro ainda não pronto: tenta de novo.
          }
          timer = setTimeout(procurar, 250);
        };
        procurar();
      } catch {
        if (ativo) setErro("Não foi possível abrir a câmera. Verifique a permissão ou digite o código.");
      }
    }
    iniciar();

    return () => {
      ativo = false;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-3">
      {erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video ref={video} muted playsInline className="aspect-video w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-highlight shadow-[0_0_12px] shadow-highlight" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ScanBarcode className="size-4" />
          Aponte a câmera para o código de barras.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => callbacks.current.onFechar()}>
          <X data-icon="inline-start" />
          Fechar
        </Button>
      </div>
    </div>
  );
}
