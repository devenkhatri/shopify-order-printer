import { AppProvider } from '@/components/providers/AppProvider'
import { TemplateEditor } from '@/components/templates/TemplateEditor'

export default function TemplatesPage() {
  return (
    <AppProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Template Editor</h1>
        <TemplateEditor />
      </div>
    </AppProvider>
  )
}