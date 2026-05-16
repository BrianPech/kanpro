import { createClient } from "@/lib/supabase/client";

export const proService = {
  async updateProfile(userId: string, profile: any) {
    const supabase = createClient();
    const { error } = await supabase
      .from("professional_profiles")
      .upsert({
        id: userId,
        full_name: profile.full_name,
        headline: profile.headline,
        bio: profile.bio,
        category: profile.category,
        location: profile.location,
        birth_date: profile.birth_date,
        phone: profile.phone,
        hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
        skills: profile.skills,
      });

    if (error) throw error;
  },

  async createService(userId: string, data: any) {
    const supabase = createClient();
    const { data: serviceData, error } = await supabase
      .from("services")
      .insert({
        professional_id: userId,
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        delivery_time: data.delivery_time,
        category: data.category,
      })
      .select()
      .single();

    if (error) throw error;
    return serviceData;
  },

  async updateService(serviceId: string, data: any) {
    const supabase = createClient();
    const { data: serviceData, error } = await supabase
      .from("services")
      .update({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        delivery_time: data.delivery_time,
        category: data.category,
        updated_at: new Date().toISOString()
      })
      .eq("id", serviceId)
      .select()
      .single();

    if (error) throw error;
    return serviceData;
  },

  async deleteService(serviceId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) throw error;
  }
};
