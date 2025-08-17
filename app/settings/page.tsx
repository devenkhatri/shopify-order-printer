import { AppProvider } from '@/components/providers/AppProvider'
import { AppSettings } from '@/components/settings/AppSettings'

export default function SettingsPage() {
  return (
    <AppProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">App Settings</h1>
        <AppSettings />
      </div>
    </AppProvider>
  )
}