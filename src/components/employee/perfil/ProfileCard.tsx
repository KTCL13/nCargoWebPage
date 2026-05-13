import { ProfileData } from '@/lib/employee/perfil/types'

interface ProfileCardProps {
  profile: ProfileData | null
  jobTitle: string
}

export function ProfileCard({ profile, jobTitle }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-nc-blue)] to-[var(--color-nc-red)] rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg">
        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
      </div>
      <h3 className="mt-4 font-titles text-xl font-bold text-[var(--color-nc-dark)]">
        {profile?.firstName} {profile?.lastName}
      </h3>
      <p className="text-sm font-subtitles text-[var(--color-nc-dark)]/50">
        {jobTitle}
      </p>
      <div className="mt-6 pt-6 border-t border-black/5 flex flex-col gap-2">
        <div className="flex justify-between text-xs font-subtitles">
          <span className="text-[var(--color-nc-dark)]/40 uppercase tracking-widest">ID</span>
          <span className="font-bold">{profile?.id}</span>
        </div>
        <div className="flex justify-between text-xs font-subtitles">
          <span className="text-[var(--color-nc-dark)]/40 uppercase tracking-widest">Status</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase text-[9px]">Activo</span>
        </div>
      </div>
    </div>
  )
}
