'use client'

import React, { useState } from 'react'
import {
  Page,
  Card,
  DataTable,
  Button,
  ButtonGroup,
  Badge,
  Modal,
  Toast,
  Frame,
  Loading,
  EmptyState,
  Banner
} from '@shopify/polaris'
import { TemplateEditor } from './TemplateEditor'
import { useTemplates } from '../../hooks/useTemplates'
import { Template } from '../../types/shopify'

export function TemplatesList() {
  const { 
    templates, 
    loading, 
    error, 
    deleteTemplate, 
    refreshTemplates 
  } = useTemplates()
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setShowEditor(true)
  }

  const handleEditTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowEditor(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    setDeleting(true)
    try {
      const result = await deleteTemplate(templateToDelete)
      
      if (result.success) {
        setToast({ content: 'Template deleted successfully' })
      } else {
        setToast({ content: result.error || 'Failed to delete template', error: true })
      }
    } catch (error) {
      setToast({ content: 'Failed to delete template', error: true })
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setTemplateToDelete(null)
    }
  }

  const handleEditorSave = (template: Template) => {
    setShowEditor(false)
    setSelectedTemplate(null)
    setToast({ content: 'Template saved successfully' })
    refreshTemplates()
  }

  const handleEditorCancel = () => {
    setShowEditor(false)
    setSelectedTemplate(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const tableRows = templates.map((template) => [
    template.name,
    template.isDefault ? <Badge tone="success">Default</Badge> : '',
    formatDate(template.updatedAt),
    (
      <ButtonGroup key={`actions-${template.id}`}>
        <Button 
          size="slim" 
          onClick={() => handleEditTemplate(template.id)}
        >
          Edit
        </Button>
        <Button 
          size="slim" 
          tone="critical"
          onClick={() => handleDeleteTemplate(template.id)}
          disabled={template.isDefault}
        >
          Delete
        </Button>
      </ButtonGroup>
    )
  ])

  const tableHeadings = [
    'Template Name',
    'Status',
    'Last Modified',
    'Actions'
  ]

  if (showEditor) {
    return (
      <TemplateEditor
        templateId={selectedTemplate || undefined}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    )
  }

  return (
    <Frame>
      <Page
        title="Templates"
        primaryAction={{
          content: 'Create Template',
          onAction: handleCreateTemplate
        }}
      >
        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        {loading ? (
          <Loading />
        ) : templates.length === 0 ? (
          <Card>
            <EmptyState
              heading="No templates found"
              action={{
                content: 'Create your first template',
                onAction: handleCreateTemplate
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create custom invoice templates for your orders with GST compliance.</p>
            </EmptyState>
          </Card>
        ) : (
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={tableHeadings}
              rows={tableRows}
            />
          </Card>
        )}

        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Template"
          primaryAction={{
            content: 'Delete',
            destructive: true,
            onAction: confirmDelete,
            loading: deleting
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowDeleteModal(false)
            }
          ]}
        >
          <Modal.Section>
            <p>Are you sure you want to delete this template? This action cannot be undone.</p>
          </Modal.Section>
        </Modal>

        {toast && (
          <Toast
            content={toast.content}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  )
}