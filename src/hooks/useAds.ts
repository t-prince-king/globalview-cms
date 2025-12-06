import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  ad_code: string;
  placement_type: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdSettings {
  id: string;
  ads_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const PLACEMENT_TYPES = [
  { value: "article_top", label: "Article Top" },
  { value: "article_middle", label: "Article Middle" },
  { value: "article_bottom", label: "Article Bottom" },
  { value: "sidebar", label: "Sidebar" },
  { value: "global_header", label: "Global Header" },
  { value: "global_footer", label: "Global Footer" },
] as const;

// Fetch all ads (for admin)
export const useAllAds = () => {
  return useQuery({
    queryKey: ["ads", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Ad[];
    },
  });
};

// Fetch active ads by placement
export const useAdsByPlacement = (placement: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["ads", "placement", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("placement_type", placement)
        .eq("status", true);

      if (error) throw error;
      return data as Ad[];
    },
    enabled,
  });
};

// Fetch global ad settings
export const useAdSettings = () => {
  return useQuery({
    queryKey: ["ad_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AdSettings | null;
    },
  });
};

// Create ad mutation
export const useCreateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: Omit<Ad, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ads")
        .insert([ad])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
};

// Update ad mutation
export const useUpdateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ad> & { id: string }) => {
      const { data, error } = await supabase
        .from("ads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
};

// Delete ad mutation
export const useDeleteAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
};

// Update ad settings mutation
export const useUpdateAdSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adsEnabled: boolean) => {
      // First get the settings id
      const { data: settings } = await supabase
        .from("ad_settings")
        .select("id")
        .limit(1)
        .single();

      if (!settings) throw new Error("Ad settings not found");

      const { data, error } = await supabase
        .from("ad_settings")
        .update({ ads_enabled: adsEnabled })
        .eq("id", settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_settings"] });
    },
  });
};
