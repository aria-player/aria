import { toast } from "sonner";
import CloseToastButton from "../components/toasts/CloseToastButton";

export function showToast(message: string) {
  toast(message, {
    style: {
      color: "var(--primary-text)",
      background: "var(--primary-background)",
      borderColor: "var(--primary-border)",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      paddingLeft: "1rem",
      fontSize: "0.75rem",
      justifyContent: "space-between",
      textOverflow: "clip"
    },
    action: CloseToastButton(() => toast.dismiss())
  });
}
