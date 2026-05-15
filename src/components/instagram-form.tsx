"use client";

import React from "react";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Download, Loader2, X, ClipboardPaste } from "lucide-react";

import { cn, getPostShortcode, isShortcodePresent } from "@/lib/utils";
import { useGetInstagramPostMutation } from "@/features/react-query/mutations/instagram";
import { HTTP_CODE_ENUM } from "@/features/api/http-codes";

// 5 minutes
const CACHE_TIME = 5 * 60 * 1000;

const useFormSchema = () => {
  const t = useTranslations("components.instagramForm.inputs");

  return z.object({
    url: z
      .string({ required_error: t("url.validation.required") })
      .trim()
      .min(1, {
        message: t("url.validation.required"),
      })
      .startsWith("https://www.instagram.com", t("url.validation.invalid"))
      .refine(
        (value) => {
          return isShortcodePresent(value);
        },
        { message: t("url.validation.invalid") }
      ),
  });
};

function triggerDownload(videoUrl: string) {
  // Ensure we are in a browser environment
  if (typeof window === "undefined") return;

  const randomTime = new Date().getTime().toString().slice(-8);
  const filename = `gram-grabberz-${randomTime}.mp4`;

  // Construct the URL to your proxy API route
  const proxyUrl = new URL("/api/download-proxy", window.location.origin); // Use relative path + origin
  proxyUrl.searchParams.append("url", videoUrl);
  proxyUrl.searchParams.append("filename", filename);

  console.log("Using proxy URL:", proxyUrl.toString()); // For debugging

  const link = document.createElement("a");
  // Set href to your proxy route
  link.href = proxyUrl.toString();
  link.target = "_blank";

  // The 'download' attribute here is less critical because the proxy
  // sets the Content-Disposition header, but it can still be helpful
  // as a fallback or hint for the browser. Keep the desired filename.
  link.setAttribute("download", filename);

  // Append link to the body temporarily
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Clean up and remove the link
  document.body.removeChild(link);
}

type CachedUrl = {
  videoUrl?: string;
  expiresAt: number;
  invalid?: {
    messageKey: string;
  };
};

export function InstagramForm(props: {
  className?: string;
  /** Styling for the gradient hero: white bar, paste, blue-gradient download. */
  variant?: "default" | "hero";
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cachedUrls = React.useRef(new Map<string, CachedUrl>());

  const t = useTranslations("components.instagramForm");
  const tBar = useTranslations("components.instagramForm.heroBar");

  const {
    isError,
    isPending,
    mutateAsync: getInstagramPost,
  } = useGetInstagramPostMutation();

  const formSchema = useFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const errorMessage = form.formState.errors.url?.message;

  const isDisabled = isPending || !form.formState.isDirty;
  const isShowClearButton = form.watch("url").length > 0;

  function clearUrlField() {
    form.setValue("url", "");
    form.clearErrors("url");
    inputRef.current?.focus();
  }

  function setCachedUrl(
    shortcode: string,
    videoUrl?: string,
    invalid?: CachedUrl["invalid"]
  ) {
    cachedUrls.current?.set(shortcode, {
      videoUrl,
      expiresAt: Date.now() + CACHE_TIME,
      invalid,
    });
  }

  function getCachedUrl(shortcode: string) {
    const cachedUrl = cachedUrls.current?.get(shortcode);

    if (!cachedUrl) {
      return null;
    }

    if (cachedUrl.expiresAt < Date.now()) {
      cachedUrls.current.delete(shortcode);
      return null;
    }

    return cachedUrl;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isError) {
      toast.dismiss("toast-error");
    }

    const shortcode = getPostShortcode(values.url);

    if (!shortcode) {
      form.setError("url", { message: t("inputs.url.validation.invalid") });
      return;
    }

    const cachedUrl = getCachedUrl(shortcode);
    if (cachedUrl?.invalid) {
      form.setError("url", { message: t(cachedUrl.invalid.messageKey) });
      return;
    }

    if (cachedUrl?.videoUrl) {
      triggerDownload(cachedUrl.videoUrl);
      return;
    }

    try {
      const { data, status } = await getInstagramPost({ shortcode });

      if (status === HTTP_CODE_ENUM.OK) {
        const downloadUrl = data.data.xdt_shortcode_media.video_url;
        if (downloadUrl) {
          triggerDownload(downloadUrl);
          setCachedUrl(shortcode, downloadUrl);
          toast.success(t("toasts.success"), {
            id: "toast-success",
            position: "top-center",
            duration: 1500,
          });
        } else {
          throw new Error("Video URL not found");
        }
      } else if (
        status === HTTP_CODE_ENUM.NOT_FOUND ||
        status === HTTP_CODE_ENUM.BAD_REQUEST ||
        status === HTTP_CODE_ENUM.TOO_MANY_REQUESTS ||
        status === HTTP_CODE_ENUM.INTERNAL_SERVER_ERROR
      ) {
        const errorMessageKey = `serverErrors.${data.error}`;
        form.setError("url", { message: t(errorMessageKey) });
        if (
          status === HTTP_CODE_ENUM.BAD_REQUEST ||
          status === HTTP_CODE_ENUM.NOT_FOUND
        ) {
          setCachedUrl(shortcode, undefined, {
            messageKey: errorMessageKey,
          });
        }
      } else {
        throw new Error("Failed to fetch video");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.error"), {
        dismissible: true,
        id: "toast-error",
        position: "top-center",
      });
    }
  }

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isHero = props.variant === "hero";

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        form.setValue("url", text.trim(), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        await form.trigger("url");
      }
    } catch {
      toast.error(tBar("pasteFailed"), {
        position: "top-center",
        duration: 2500,
      });
    }
  }

  return (
    <div className={cn("w-full space-y-2", props.className)}>
      {errorMessage ? (
        <p
          className={cn(
            "h-4 text-sm sm:text-start",
            isHero ? "text-red-200" : "text-red-500"
          )}
        >
          {errorMessage}
        </p>
      ) : (
        <div className="h-4"></div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            isHero
              ? "flex w-full flex-col gap-3"
              : "flex w-full flex-col gap-2 sm:flex-row sm:items-end"
          )}
        >
          {isHero ? (
            <div className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 sm:flex-row sm:items-stretch">
              <FormField
                control={form.control}
                name="url"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem className="min-w-0 flex-1">
                    <FormLabel className="sr-only">
                      {t("inputs.url.label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        ref={inputRef}
                        minLength={1}
                        maxLength={255}
                        placeholder={tBar("placeholder")}
                        className="h-12 border-0 bg-transparent px-3 text-base text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-sky-400/35 md:px-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void pasteFromClipboard()}
                  className="h-12 flex-1 gap-2 rounded-xl border-0 bg-neutral-100 font-medium text-neutral-700 shadow-none hover:bg-neutral-200 sm:flex-initial sm:px-5"
                >
                  <ClipboardPaste className="size-4 shrink-0 text-neutral-600" />
                  {tBar("paste")}
                </Button>
                <Button
                  disabled={isDisabled}
                  type="submit"
                  className="h-12 flex-1 gap-2 rounded-xl border-0 bg-gradient-to-b from-sky-400 to-blue-700 px-5 font-semibold text-white shadow-sm hover:from-sky-500 hover:to-blue-800 disabled:opacity-50 sm:flex-initial [&_svg]:text-white"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t("submit")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <FormField
                control={form.control}
                name="url"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">
                      {t("inputs.url.label")}
                    </FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Input
                          {...field}
                          type="url"
                          ref={inputRef}
                          minLength={1}
                          maxLength={255}
                          placeholder={t("inputs.url.placeholder")}
                        />
                        {isShowClearButton && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={clearUrlField}
                            className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 cursor-pointer"
                          >
                            <X className="text-red-500" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                disabled={isDisabled}
                type="submit"
                className="bg-teal-500 text-white hover:bg-teal-600 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("submit")}
              </Button>
            </>
          )}
        </form>
      </Form>
      <p
        className={cn(
          "text-center text-xs",
          isHero ? "text-white/85" : "text-muted-foreground"
        )}
      >
        {t("hint")}
      </p>
    </div>
  );
}
