import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { useChatApi } from "@/lib/api/chat/useChatApi";
import { useNotificationApi } from "@/lib/api/notification/useNotificationApi";
import { useChatContext } from "@/lib/context";
import { useKnowledgeToFeedContext } from "@/lib/context/KnowledgeToFeedProvider/hooks/useKnowledgeToFeedContext";

import { useChatInput } from "../components/ActionsBar/components/ChatInput/hooks/useChatInput";
import { getChatNotificationsQueryKey } from "../utils/getChatNotificationsQueryKey";
import { getMessagesFromChatItems } from "../utils/getMessagesFromChatItems";
import { getNotificationsFromChatItems } from "../utils/getNotificationsFromChatItems";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useChatNotificationsSync = () => {
  const { message } = useChatInput()
  const { setMessages, setNotifications, notifications } = useChatContext();
  const { getChatItems } = useChatApi();
  const { getChatNotifications } = useNotificationApi();
  const { setShouldDisplayFeedCard } = useKnowledgeToFeedContext();
  const params = useParams();

  const chatId = params?.chatId as string | undefined;

  const chatNotificationsQueryKey = getChatNotificationsQueryKey(chatId ?? "");
  const { data: fetchedNotifications = [] } = useQuery({
    queryKey: [chatNotificationsQueryKey],
    enabled: notifications.length > 0,
    queryFn: () => {
      if (chatId === undefined) {
        return [];
      }

      return getChatNotifications(chatId);
    },
    refetchInterval: () => {
      if (notifications.length === 0) {
        return false;
      }
      const hasAPendingNotification = notifications.find(
        (item) => item.status === "Pending"
      );

      if (hasAPendingNotification) {
        return 2_000; // in ms
      }

      return false;
    },
  });

  useEffect(() => {
    if (fetchedNotifications.length === 0) {
      return;
    }
    setNotifications(fetchedNotifications);
  }, [fetchedNotifications]);

  useEffect(() => {
    setShouldDisplayFeedCard(false);
    const fetchHistory = async () => {
      if (chatId === undefined) {
        setMessages([]);
        setNotifications([]);

        return;
      }

      if (!message) {
        const chatItems = await getChatItems(chatId);
        setMessages(getMessagesFromChatItems(chatItems));
        setNotifications(getNotificationsFromChatItems(chatItems));
      }
    };
    void fetchHistory();
  }, [chatId]);
};
