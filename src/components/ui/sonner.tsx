import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  let activeTheme: ToasterProps["theme"] = "dark";
  try {
    const context = useTheme();
    if (context && context.theme) {
      activeTheme = context.theme as ToasterProps["theme"];
    }
  } catch {
    activeTheme = "dark";
  }

  return (
    <Sonner
      theme={activeTheme}
      position="top-right"
      richColors
      closeButton
      expand={false}
      duration={3500}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl font-sans text-xs rounded-xl pointer-events-auto",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
