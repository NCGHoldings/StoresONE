import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  getNotificationIcon,
} from "@/hooks/useNotifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markRead.mutate(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
  };

  const getNotificationLink = (notification: typeof notifications[0]) => {
    if (notification.request_id) {
      return "/admin/approval-console";
    }
    if (notification.entity_type && notification.entity_id) {
      switch (notification.entity_type) {
        case "purchase_requisition":
          return "/procurement/requisitions";
        case "purchase_order":
          return "/procurement/orders";
        case "goods_receipt":
          return "/procurement/goods-receipt";
        case "supplier_registration":
          return "/sourcing/suppliers";
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs h-7"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const content = (
                  <div
                    className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <div className="flex gap-1 ml-auto">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleMarkRead(notification.id, e)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(notification.id, e)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            {link && (
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={notification.id} to={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            asChild
          >
            <Link to="/admin/approval-console">
              View all in Approval Console
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
