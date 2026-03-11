'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  UserPlus,
  CheckCircle,
  X,
  Dumbbell,
  Clock,
  CheckCheck,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

interface InAppNotification {
  id: string;
  userId: string;
  userRole: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_rejected' | 'new_workout';
  title: string;
  body: string;
  action?: { type: 'navigate'; destination: string };
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

type DateGroup = 'Hoje' | 'Ontem' | 'Anteriores';

interface GroupedNotifications {
  label: DateGroup;
  items: InAppNotification[];
}

function getDateGroup(ts: Timestamp): DateGroup {
  const date = ts.toDate();
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  if (date >= startOfToday) return 'Hoje';
  if (date >= startOfYesterday) return 'Ontem';
  return 'Anteriores';
}

function groupNotifications(notifications: InAppNotification[]): GroupedNotifications[] {
  const groups: Record<DateGroup, InAppNotification[]> = {
    Hoje: [],
    Ontem: [],
    Anteriores: [],
  };

  for (const n of notifications) {
    if (n.createdAt) {
      groups[getDateGroup(n.createdAt)].push(n);
    } else {
      groups['Anteriores'].push(n);
    }
  }

  return (['Hoje', 'Ontem', 'Anteriores'] as DateGroup[])
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, items: groups[label] }));
}

function formatRelativeTime(ts: Timestamp | null): string {
  if (!ts) return '-';
  const date = ts.toDate();
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

interface NotificationIconProps {
  type: InAppNotification['type'];
}

function NotificationIcon({ type }: NotificationIconProps) {
  switch (type) {
    case 'connection_request':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <UserPlus className="h-5 w-5 text-blue-600" />
        </div>
      );
    case 'connection_accepted':
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      );
    case 'connection_rejected':
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <X className="h-5 w-5 text-red-600" />
        </div>
      );
    case 'new_workout':
      return (
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="h-5 w-5 text-purple-600" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Bell className="h-5 w-5 text-gray-500" />
        </div>
      );
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(100));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: InAppNotification[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as InAppNotification[];

          setNotifications(items);
          setLoading(false);
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          setLoading(false);
        }
      );
    })();

    return () => {
      unsubscribe?.();
    };
  }, [user?.uid]);

  const handleNotificationClick = useCallback(
    async (notification: InAppNotification) => {
      if (!notification.isRead) {
        setMarkingRead(notification.id);
        try {
          await apiRequest(`/api/notifications/${notification.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isRead: true }),
          });
        } catch (err) {
          console.error('Error marking notification as read:', err);
        } finally {
          setMarkingRead(null);
        }
      }

      if (notification.action?.type === 'navigate' && notification.action.destination) {
        router.push(notification.action.destination);
      }
    },
    [router]
  );

  const handleMarkAllRead = useCallback(async () => {
    const hasUnread = notifications.some((n) => !n.isRead);
    if (!hasUnread || markingAll) return;

    setMarkingAll(true);
    try {
      await apiRequest('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'markAllRead' }),
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  }, [notifications, markingAll]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const grouped = groupNotifications(notifications);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificacoes</h1>
          {unreadCount > 0 && (
            <p className="text-gray-500 mt-1">
              {unreadCount} {unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}
            </p>
          )}
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {markingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Marcar todas como lidas
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Nenhuma notificação
          </h3>
          <p className="text-sm text-gray-500">
            Quando houver novidades, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        /* Grouped notification list */
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label} className="space-y-2">
              {/* Date group label */}
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {group.label}
                </span>
              </div>

              {/* Notification cards */}
              <div className="space-y-2">
                {group.items.map((notification) => {
                  const isBeingMarked = markingRead === notification.id;
                  const isClickable =
                    notification.action?.type === 'navigate' ||
                    !notification.isRead;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`rounded-xl border p-4 flex items-start gap-4 transition-all ${
                        isClickable
                          ? 'cursor-pointer hover:shadow-md'
                          : 'cursor-default'
                      } ${
                        notification.isRead
                          ? 'bg-white border-gray-100 shadow-sm'
                          : 'bg-primary-50 border-primary-100 shadow-sm'
                      } ${isBeingMarked ? 'opacity-60' : ''}`}
                    >
                      {/* Icon */}
                      <NotificationIcon type={notification.type} />

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              notification.isRead
                                ? 'font-normal text-gray-700'
                                : 'font-semibold text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5 flex items-center gap-1">
                            {isBeingMarked && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>

                        {notification.action?.type === 'navigate' && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary-600">
                            <MessageCircle className="h-3 w-3" />
                            Ver detalhes
                          </span>
                        )}
                      </div>

                      {/* Unread dot */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
