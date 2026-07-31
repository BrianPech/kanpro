import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: "application_status" | "system" | "message" | string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  // Fetch initial notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Notifications unavailable:", error.message || error);
      return [];
    }

    return (data as Notification[]) || [];
  },

  // Mark a notification as read (using body parameters, avoiding URL query leaks)
  async markAsRead(notificationId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read in service:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read in service:", error);
      throw error;
    }
  },

  // Listen to INSERT events in real-time filtered by user_id
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ) {
    const supabase = createClient();

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            onNotification(payload.new as Notification);
          }
        }
      )
      .subscribe();

    // Return unsubscriber function
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
