import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { differenceInCalendarDays } from "date-fns";

/**
 * Returns the intern's active program enrollment (if any) plus the active program details.
 */
export function useEnrollment() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-enrollment", user?.id],
    queryFn: async () => {
      const { data: enrollment } = await supabase
        .from("program_enrollments")
        .select("*, internship_programs!inner(*)")
        .eq("intern_id", user!.id)
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!enrollment) return null;
      const program: any = (enrollment as any).internship_programs;
      const today = new Date();
      const start = new Date(program.start_date);
      const elapsed = Math.max(0, differenceInCalendarDays(today, start) + 1);
      const currentDay = Math.min(elapsed, program.total_days);
      return { enrollment, program, currentDay };
    },
    enabled: !!user,
  });
}
