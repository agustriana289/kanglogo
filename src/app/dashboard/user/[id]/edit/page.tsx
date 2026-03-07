import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditProfileClient from "./EditProfileClient";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Dapatkan user yang sedang login saat ini
  const { data: authData } = await supabase.auth.getUser();
  const isOwnProfile = authData.user?.id === id;

  // Proteksi rute canggih: Hanya sang pemilik asli yang boleh melihat form EDIT miliknya
  if (!isOwnProfile) {
    redirect(`/dashboard/user/${id}`);
  }

  // Coba ambil profil asli
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile || error) {
    notFound();
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="w-full">
        <EditProfileClient profile={profile} />
      </div>
    </div>
  );
}
