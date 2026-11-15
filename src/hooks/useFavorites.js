import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFavoriteDriver,
  getFavoriteDrivers,
  removeFavoriteDriver,
} from "../components/FavoritesService";
import { useAuth } from "../components/AuthProvider";

/**
 * The signed-in user's favorite driver ids, plus an optimistic toggle.
 * Shared by the standings, driver page and favorites page so a star flipped
 * in one place is reflected everywhere without refetching.
 */
export function useFavorites({ setAlert } = {}) {
  const { user, enabled } = useAuth();
  const queryClient = useQueryClient();
  const key = ["favorites", user?.uid];

  const query = useQuery({
    queryKey: key,
    queryFn: () => getFavoriteDrivers(user.uid),
    enabled: enabled && Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ driverId, add }) =>
      add ? addFavoriteDriver(user.uid, driverId) : removeFavoriteDriver(user.uid, driverId),
    onMutate: async ({ driverId, add }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key) ?? [];
      queryClient.setQueryData(
        key,
        add ? [...new Set([...previous, driverId])] : previous.filter((id) => id !== driverId)
      );
      return { previous };
    },
    onError: (_error, { add }, context) => {
      queryClient.setQueryData(key, context?.previous);
      setAlert?.({
        visible: true,
        message: add
          ? "Couldn't save that favorite. Please try again."
          : "Couldn't remove that favorite. Please try again.",
        color: "danger",
      });
    },
    onSuccess: (_data, { add, name }) => {
      setAlert?.({
        visible: true,
        message: add
          ? `${name ?? "Driver"} added to favorites`
          : `${name ?? "Driver"} removed from favorites`,
        color: "success",
      });
    },
  });

  const ids = query.data ?? [];
  return {
    ids,
    query,
    isFavorite: (driverId) => ids.includes(driverId),
    toggle: (driverId, name) =>
      mutation.mutate({ driverId, name, add: !ids.includes(driverId) }),
  };
}
