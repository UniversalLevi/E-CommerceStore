'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  Folder,
  File,
  FileCode,
  FileJson,
  Code,
  Terminal,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  AlertCircle,
  CheckCircle,
  Sparkles,
  X,
} from 'lucide-react';

// Dynamically import Monaco Editor (client-side only)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-surface-base">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
    </div>
  ),
});

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}

interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  previewImage: string;
  category: string;
  isActive: boolean;
  isDeleted: boolean;
  fileTree: FileTreeNode[];
  validation: {
    valid: boolean;
    errors: string[];
  };
}

const getFileIcon = (extension?: string) => {
  switch (extension) {
    case 'liquid':
      return <FileCode className="h-4 w-4 text-green-500" />;
    case 'json':
      return <FileJson className="h-4 w-4 text-amber-500" />;
    case 'css':
      return <Code className="h-4 w-4 text-blue-500" />;
    case 'js':
      return <Terminal className="h-4 w-4 text-yellow-500" />;
    default:
      return <File className="h-4 w-4 text-text-secondary" />;
  }
};

const getLanguageFromExtension = (extension?: string): string => {
  switch (extension) {
    case 'liquid':
      return 'html'; // Monaco doesn't have Liquid support, use HTML as fallback
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'js':
      return 'javascript';
    default:
      return 'plaintext';
  }
};

interface FileTreeItemProps {
  node: FileTreeNode;
  level: number;
  selectedFile: string | null;
  expandedFolders: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

interface NewFileModalProps {
  folder: string;
  fileName: string;
  onFolderChange: (folder: string) => void;
  onFileNameChange: (fileName: string) => void;
  onClose: () => void;
  onCreate: (useAI: boolean, prompt?: string) => void;
}

function NewFileModal({
  folder,
  fileName,
  onFolderChange,
  onFileNameChange,
  onClose,
  onCreate,
}: NewFileModalProps) {
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleCreate = () => {
    if (useAI && aiPrompt.trim()) {
      onCreate(true, aiPrompt);
    } else {
      onCreate(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Create New File
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Folder
              </label>
              <select
                value={folder}
                onChange={(e) => onFolderChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="sections">sections/</option>
                <option value="templates">templates/</option>
                <option value="layout">layout/</option>
                <option value="assets">assets/</option>
                <option value="config">config/</option>
                <option value="pages">pages/</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                File Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => onFileNameChange(e.target.value)}
                placeholder={
                  folder === 'sections'
                    ? 'my-section.liquid'
                    : folder === 'templates'
                    ? 'page.about.json'
                    : folder === 'layout'
                    ? 'theme.liquid'
                    : folder === 'assets'
                    ? 'custom.css'
                    : folder === 'config'
                    ? 'settings_schema.json'
                    : 'faq.json'
                }
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-purple-600 focus:ring-purple-500"
                />
                <span className="text-text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Generate with AI
                </span>
              </label>
            </div>
            {useAI && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  AI Prompt
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-surface-base border-t border-border-default flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!fileName || (useAI && !aiPrompt.trim())}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {useAI && <Sparkles className="h-4 w-4" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function FileTreeItem({
  node,
  level,
  selectedFile,
  expandedFolders,
  onSelectFile,
  onToggleFolder,
  onDeleteFile,
}: FileTreeItemProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;

  return (
    <div>
      <div
        onClick={() => {
          if (node.type === 'directory') {
            onToggleFolder(node.path);
          } else {
            onSelectFile(node.path);
          }
        }}
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-purple-500/20 text-purple-400'
            : 'hover:bg-surface-hover text-text-primary'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-text-secondary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            )}
            <Folder className="h-4 w-4 text-amber-500" />
          </>
        ) : (
          <>
            <span className="w-4" />
            {getFileIcon(node.extension)}
          </>
        )}
        <span className="flex-1 truncate text-sm">{node.name}</span>
        {node.type === 'file' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.path);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        )}
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['sections', 'templates', 'assets', 'pages'])
  );
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    category: '',
    previewImage: '',
    isActive: false,
  });
  const [newFileModal, setNewFileModal] = useState<{
    isOpen: boolean;
    folder: string;
    fileName: string;
  }>({
    isOpen: false,
    folder: 'sections',
    fileName: '',
  });
  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    generating: boolean;
    prompt: string;
  }>({
    isOpen: false,
    generating: false,
    prompt: '',
  });
  const [fullThemeModal, setFullThemeModal] = useState<{
    isOpen: boolean;
    generating: boolean;
    prompt: string;
  }>({
    isOpen: false,
    generating: false,
    prompt: '',
  });

  const hasUnsavedChanges = fileContent !== originalContent;

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: Template }>(
        `/api/admin/templates/${templateId}`
      );
      setTemplate(response.data);
      setSettingsForm({
        name: response.data.name,
        description: response.data.description,
        category: response.data.category,
        previewImage: response.data.previewImage,
        isActive: response.data.isActive,
      });
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to load template');
      router.push('/admin/templates');
    } finally {
      setLoading(false);
    }
  }, [templateId, router]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const loadFileContent = async (filePath: string) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Do you want to discard them?'
      );
      if (!confirm) return;
    }

    try {
      setLoadingFile(true);
      const response = await api.get<{ success: boolean; data: { content: string } }>(
        `/api/admin/templates/${templateId}/files/${filePath}`
      );
      setSelectedFile(filePath);
      setFileContent(response.data.content);
      setOriginalContent(response.data.content);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to load file');
    } finally {
      setLoadingFile(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    try {
      setSaving(true);
      await api.put(`/api/admin/templates/${templateId}/files/${selectedFile}`, {
        content: fileContent,
      });
      setOriginalContent(fileContent);
      notify.success('File saved');
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const createFile = async (useAI: boolean = false, aiPrompt?: string) => {
    if (!newFileModal.fileName) return;

    const filePath = `${newFileModal.folder}/${newFileModal.fileName}`;
    let content = getDefaultContent(newFileModal.fileName);

    // If using AI, generate code first
    if (useAI && aiPrompt) {
      try {
        const fileExtension = newFileModal.fileName.split('.').pop();
        let codeType: 'liquid' | 'json' | 'css' | 'js' = 'liquid';
        
        if (fileExtension === 'liquid') codeType = 'liquid';
        else if (fileExtension === 'json') codeType = 'json';
        else if (fileExtension === 'css') codeType = 'css';
        else if (fileExtension === 'js') codeType = 'js';

        const response = await api.post<{ success: boolean; data: { code: string } }>(
          `/api/admin/templates/${templateId}/generate-code`,
          {
            prompt: aiPrompt,
            codeType,
            filePath,
          }
        );
        content = response.data.code;
      } catch (error: any) {
        notify.error(error.response?.data?.error || 'Failed to generate code, using default');
        // Continue with default content
      }
    }

    try {
      await api.post(`/api/admin/templates/${templateId}/files`, {
        filePath,
        content,
      });
      notify.success('File created');
      setNewFileModal({ isOpen: false, folder: 'sections', fileName: '' });
      await fetchTemplate();
      loadFileContent(filePath);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to create file');
    }
  };

  const deleteFile = async (filePath: string) => {
    if (!confirm(`Delete "${filePath}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/api/admin/templates/${templateId}/files/${filePath}`);
      notify.success('File deleted');
      if (selectedFile === filePath) {
        setSelectedFile(null);
        setFileContent('');
        setOriginalContent('');
      }
      await fetchTemplate();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put(`/api/admin/templates/${templateId}`, settingsForm);
      notify.success('Settings saved');
      setShowSettings(false);
      await fetchTemplate();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedFolders(newSet);
  };

  const getDefaultContent = (fileName: string) => {
    if (fileName.endsWith('.liquid')) {
      const isSection = fileName.includes('sections/');
      const isTemplate = fileName.includes('templates/');
      const isLayout = fileName.includes('layout/');
      const sectionName = fileName.replace('.liquid', '').split('/').pop() || '';
      const displayName = sectionName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (isLayout) {
        return `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="">
    <link rel="canonical" href="{{ canonical_url }}">
    
    {%- if settings.favicon != blank -%}
      <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 32, height: 32 }}">
    {%- endif -%}
    
    <title>
      {{ page_title }}
      {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
    </title>
    
    {% if page_description %}
      <meta name="description" content="{{ page_description | escape }}">
    {% endif %}
    
    {{ content_for_header }}
    
    {{ 'base.css' | asset_url | stylesheet_tag }}
    
    <script>document.documentElement.className = document.documentElement.className.replace('no-js', 'js');</script>
  </head>
  
  <body class="gradient">
    <a class="skip-to-content-link button visually-hidden" href="#MainContent">
      Skip to content
    </a>
    
    {% sections 'header-group' %}
    
    <main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
    
    {% sections 'footer-group' %}
    
    <script>
      window.shopUrl = '{{ request.origin }}';
      window.routes = {
        cart_add_url: '{{ routes.cart_add_url }}',
        cart_change_url: '{{ routes.cart_change_url }}',
        cart_update_url: '{{ routes.cart_update_url }}',
        cart_url: '{{ routes.cart_url }}'
      };
    </script>
  </body>
</html>`;
      }
      
      if (isSection) {
        return `{% comment %}
  ${displayName} Section
  
  Example AI prompts:
  - "Create a hero section with heading, subheading, CTA button, and background image"
  - "Create a product grid section with filters and pagination"
  - "Create a newsletter signup section with email input"
{% endcomment %}

<section class="${sectionName}-section" data-section-id="{{ section.id }}">
  <div class="page-width">
    <h2 class="${sectionName}-section__heading">
      {{ section.settings.heading | default: 'Section Heading' }}
    </h2>
    <div class="${sectionName}-section__content">
      {{ section.settings.content }}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "${displayName}",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Section Heading"
    },
    {
      "type": "richtext",
      "id": "content",
      "label": "Content",
      "default": "<p>Add your content here</p>"
    }
  ],
  "presets": [
    {
      "name": "${displayName}"
    }
  ]
}
{% endschema %}`;
      }
      
      if (isTemplate) {
        return `{% comment %}
  ${displayName} Template
  
  Example AI prompts:
  - "Create a product page template with images, variants, and add to cart"
  - "Create a collection page template with filters and product grid"
  - "Create a cart page template with line items and checkout button"
{% endcomment %}

{% layout 'theme' %}

<div class="template-${sectionName}">
  <div class="page-width">
    <h1>{{ page.title }}</h1>
    <div class="rte">
      {{ page.content }}
    </div>
  </div>
</div>`;
      }
      
      return `{% comment %}
  ${displayName} Liquid File
  Use AI to generate content for this file.
{% endcomment %}`;
    }
    
    if (fileName.endsWith('.json')) {
      const isTemplate = fileName.includes('templates/');
      const isPage = fileName.includes('pages/');
      const fileNameOnly = fileName.split('/').pop()?.replace('.json', '') || '';
      
      if (isTemplate) {
        return `{
  "sections": {
    "main": {
      "type": "main-${fileNameOnly}",
      "settings": {}
    }
  },
  "order": [
    "main"
  ]
}`;
      }
      
      if (isPage) {
        return `{
  "title": "${fileNameOnly.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}",
  "handle": "${fileNameOnly}",
  "body_html": "<p>This is the content for the ${fileNameOnly} page. Use AI to generate rich HTML content.</p>",
  "published": true,
  "template_suffix": ""
}`;
      }
      
      return `{
  "comment": "Use AI to generate JSON content for this file"
}`;
    }
    
    if (fileName.endsWith('.css')) {
      return `/* 
  ${fileName} - Custom Styles
  
  Example AI prompts:
  - "Create modern CSS with smooth animations and responsive design"
  - "Create CSS for a minimalist e-commerce theme"
  - "Create CSS with custom color variables and component styles"
*/

:root {
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #ff6b6b;
  --spacing-unit: 1rem;
  --border-radius: 4px;
}

/* Add your custom styles below */
`;
    }
    
    if (fileName.endsWith('.js')) {
      return `/**
 * ${fileName} - Custom JavaScript
 * 
 * Example AI prompts:
 * - "Create JavaScript for smooth scroll animations and lazy loading"
 * - "Create a product variant selector with dynamic price updates"
 * - "Create a cart drawer with add/remove functionality"
 */

(function() {
  'use strict';
  
  document.addEventListener('DOMContentLoaded', function() {
    // Add your JavaScript code here
    console.log('${fileName} loaded');
  });
})();`;
    }
    
    return '';
  };

  const generateCodeWithAI = async () => {
    if (!aiModal.prompt.trim() || !selectedFile) return;

    const fileExtension = selectedFile.split('.').pop();
    let codeType: 'liquid' | 'json' | 'css' | 'js' = 'liquid';
    
    if (fileExtension === 'liquid') codeType = 'liquid';
    else if (fileExtension === 'json') codeType = 'json';
    else if (fileExtension === 'css') codeType = 'css';
    else if (fileExtension === 'js') codeType = 'js';
    else {
      notify.error('Cannot determine code type from file extension');
      return;
    }

    try {
      setAiModal(prev => ({ ...prev, generating: true }));
      
      const response = await api.post<{ success: boolean; data: { code: string; codeType: string } }>(
        `/api/admin/templates/${templateId}/generate-code`,
        {
          prompt: aiModal.prompt,
          codeType,
          filePath: selectedFile,
          existingCode: fileContent,
        }
      );

      // Replace current content with generated code
      setFileContent(response.data.code);
      setAiModal({ isOpen: false, generating: false, prompt: '' });
      notify.success('Code generated successfully!');
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to generate code');
      setAiModal(prev => ({ ...prev, generating: false }));
    }
  };

  const generateFullTheme = async () => {
    if (!fullThemeModal.prompt.trim()) return;

    try {
      setFullThemeModal(prev => ({ ...prev, generating: true }));
      
      const response = await api.post<{ 
        success: boolean; 
        message: string;
        data: { 
          filesCreated: number;
          files: string[];
          errors?: string[];
        } 
      }>(
        `/api/admin/templates/${templateId}/generate-theme`,
        {
          prompt: fullThemeModal.prompt,
        }
      );

      if (response.success) {
        const filesCount = response.data?.filesCreated || 0;
        const errors = response.data?.errors || [];
        
        if (filesCount > 0) {
          notify.success(response.message || `Successfully generated ${filesCount} files!`);
          setFullThemeModal({ isOpen: false, generating: false, prompt: '' });
          
          // Refresh template to show new files
          await fetchTemplate();
          
          if (errors.length > 0) {
            console.warn('Some files had errors:', errors);
            notify.error(`Generated ${filesCount} files, but ${errors.length} had errors. Check console for details.`);
          }
        } else {
          notify.error('No files were generated. Please check your prompt and try again.');
          setFullThemeModal(prev => ({ ...prev, generating: false }));
        }
      } else {
        notify.error(response.message || 'Failed to generate theme');
        setFullThemeModal(prev => ({ ...prev, generating: false }));
      }
    } catch (error: any) {
      console.error('Theme generation error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to generate theme. Please check your OpenAI API key and try again.';
      notify.error(errorMessage);
      setFullThemeModal(prev => ({ ...prev, generating: false }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          saveFile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, fileContent, selectedFile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const selectedFileExtension = selectedFile?.split('.').pop();

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-border-default">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/templates"
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              {template.name}
              {template.isActive ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white">
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600 text-white">
                  Inactive
                </span>
              )}
            </h1>
            <p className="text-xs text-text-secondary">Slug: {template.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate Full Theme Button */}
          <button
            onClick={() => setFullThemeModal({ isOpen: true, generating: false, prompt: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            title="Generate complete theme with AI"
          >
            <Sparkles className="h-4 w-4" />
            Generate Full Theme
          </button>

          {/* Validation Status */}
          {template.validation.valid ? (
            <div className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              Valid
            </div>
          ) : (
            <div
              className="flex items-center gap-1 text-amber-500 text-sm cursor-pointer"
              title={template.validation.errors.join('\n')}
            >
              <AlertCircle className="h-4 w-4" />
              {template.validation.errors.length} issues
            </div>
          )}

          <button
            onClick={fetchTemplate}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5 text-text-secondary" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-text-secondary" />
          </button>

          {hasUnsavedChanges && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}

          <button
            onClick={saveFile}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 bg-surface-raised border-r border-border-default flex flex-col">
          <div className="p-3 border-b border-border-default flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Files</span>
            <button
              onClick={() =>
                setNewFileModal({ isOpen: true, folder: 'sections', fileName: '' })
              }
              className="p-1.5 hover:bg-surface-hover rounded transition-colors"
              title="New File"
            >
              <Plus className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {template.fileTree.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                level={0}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onSelectFile={loadFileContent}
                onToggleFolder={toggleFolder}
                onDeleteFile={deleteFile}
              />
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* File Tab */}
              <div className="px-4 py-2 bg-surface-base border-b border-border-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFileExtension)}
                  <span className="text-sm text-text-primary">{selectedFile}</span>
                  {hasUnsavedChanges && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <button
                  onClick={() => setAiModal({ isOpen: true, generating: false, prompt: '' })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                  title="Generate code with AI"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                {loadingFile ? (
                  <div className="flex items-center justify-center h-full bg-surface-base">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <MonacoEditor
                    height="100%"
                    language={getLanguageFromExtension(selectedFileExtension)}
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineHeight: 22,
                      padding: { top: 16 },
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-surface-base">
              <div className="text-center">
                <FileCode className="h-16 w-16 text-text-secondary/30 mx-auto mb-4" />
                <p className="text-text-secondary">
                  Select a file to start editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-6">
                Template Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    value={settingsForm.description}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Category
                  </label>
                  <select
                    value={settingsForm.category}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="modern">Modern</option>
                    <option value="luxury">Luxury</option>
                    <option value="bold">Bold</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Preview Image URL
                  </label>
                  <input
                    type="text"
                    value={settingsForm.previewImage}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, previewImage: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.isActive}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border-default text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-text-primary">Active (visible to users)</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-base border-t border-border-default flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {newFileModal.isOpen && (
        <NewFileModal
          folder={newFileModal.folder}
          fileName={newFileModal.fileName}
          onFolderChange={(folder) =>
            setNewFileModal({ ...newFileModal, folder })
          }
          onFileNameChange={(fileName) =>
            setNewFileModal({ ...newFileModal, fileName })
          }
          onClose={() =>
            setNewFileModal({ isOpen: false, folder: 'sections', fileName: '' })
          }
          onCreate={(useAI, prompt) => createFile(useAI, prompt)}
        />
      )}

      {/* Generate Full Theme Modal */}
      {fullThemeModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Generate Complete Theme with AI
                </h2>
                <button
                  onClick={() => setFullThemeModal({ isOpen: false, generating: false, prompt: '' })}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  disabled={fullThemeModal.generating}
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Describe your theme
                  </label>
                  <textarea
                    value={fullThemeModal.prompt}
                    onChange={(e) =>
                      setFullThemeModal({ ...fullThemeModal, prompt: e.target.value })
                    }
                    placeholder="e.g., Create a modern minimalist e-commerce theme with a clean header, hero section, product grid, shopping cart functionality, and responsive footer. Use a color scheme with blue and white."
                    rows={6}
                    className="w-full px-4 py-3 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    disabled={fullThemeModal.generating}
                  />
                  <p className="mt-2 text-xs text-text-secondary">
                    Be specific about the design style, features, and color scheme you want.
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">
                    <strong>What will be generated:</strong>
                  </p>
                  <ul className="text-sm text-purple-200 mt-2 space-y-1 list-disc list-inside">
                    <li>Layout file (theme.liquid)</li>
                    <li>Header, Footer, and Hero sections</li>
                    <li>Product and Collection sections</li>
                    <li>Homepage, Product, and Collection templates</li>
                    <li>Complete CSS with responsive design</li>
                    <li>JavaScript for cart and interactions</li>
                    <li>Theme settings and configuration</li>
                    <li>Homepage content</li>
                  </ul>
                  <p className="text-sm text-purple-300 mt-3">
                    <strong>Note:</strong> This will generate all files for a complete theme. Existing files may be overwritten.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-base border-t border-border-default flex justify-end gap-3">
              <button
                onClick={() => setFullThemeModal({ isOpen: false, generating: false, prompt: '' })}
                disabled={fullThemeModal.generating}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={generateFullTheme}
                disabled={fullThemeModal.generating || !fullThemeModal.prompt.trim() || fullThemeModal.prompt.length < 20}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {fullThemeModal.generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Theme...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Complete Theme
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Code Generation Modal */}
      {aiModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Code Generation
                </h2>
                <button
                  onClick={() => setAiModal({ isOpen: false, generating: false, prompt: '' })}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Describe what you want to generate
                  </label>
                  <textarea
                    value={aiModal.prompt}
                    onChange={(e) =>
                      setAiModal({ ...aiModal, prompt: e.target.value })
                    }
                    placeholder={
                      selectedFileExtension === 'liquid'
                        ? 'e.g., Create a hero section with a large heading, subheading, and CTA button with customizable colors and text'
                        : selectedFileExtension === 'json'
                        ? 'e.g., Create a homepage template with hero, featured products, and newsletter sections'
                        : selectedFileExtension === 'css'
                        ? 'e.g., Create modern CSS with smooth animations, responsive design, and dark mode support'
                        : 'e.g., Create JavaScript for smooth scroll animations and lazy loading images'
                    }
                    rows={6}
                    className="w-full px-4 py-3 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    disabled={aiModal.generating}
                  />
                  <p className="mt-2 text-xs text-text-secondary">
                    Currently editing: <span className="font-mono">{selectedFile}</span>
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">
                    <strong>Tip:</strong> Be specific about what you want. The AI will generate code
                    based on your prompt and the current file type ({selectedFileExtension}).
                    {fileContent && (
                      <span className="block mt-1">
                        Your existing code will be used as context to improve the generation.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-base border-t border-border-default flex justify-end gap-3">
              <button
                onClick={() => setAiModal({ isOpen: false, generating: false, prompt: '' })}
                disabled={aiModal.generating}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={generateCodeWithAI}
                disabled={aiModal.generating || !aiModal.prompt.trim() || !selectedFile}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiModal.generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

