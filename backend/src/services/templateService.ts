import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const copyFile = promisify(fs.copyFile);

// Use fs.promises.rm for recursive directory removal
const rmdir = fs.promises.rm;

// Base path for templates directory
const TEMPLATES_BASE_PATH = path.join(__dirname, '../../templates');

export interface TemplateFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  modifiedAt?: Date;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  previewImage: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Ensure the templates directory exists
 */
export async function ensureTemplatesDirectory(): Promise<void> {
  try {
    await mkdir(TEMPLATES_BASE_PATH, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Validate template slug to prevent directory traversal
 */
export function validateSlug(slug: string): boolean {
  // Only allow lowercase letters, numbers, and hyphens
  const validSlugPattern = /^[a-z0-9-]+$/;
  // Prevent directory traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return false;
  }
  return validSlugPattern.test(slug);
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(filePath: string): boolean {
  // Prevent directory traversal
  if (filePath.includes('..')) {
    return false;
  }
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');
  // Check for any traversal attempts
  const pathParts = normalizedPath.split('/');
  return pathParts.every(part => !part.startsWith('.') || part === '.');
}

/**
 * Get full path for a template
 */
export function getTemplatePath(slug: string): string {
  if (!validateSlug(slug)) {
    throw new Error('Invalid template slug');
  }
  return path.join(TEMPLATES_BASE_PATH, slug);
}

/**
 * Get full path for a file within a template
 */
export function getTemplateFilePath(slug: string, filePath: string): string {
  if (!validateSlug(slug)) {
    throw new Error('Invalid template slug');
  }
  if (!validateFilePath(filePath)) {
    throw new Error('Invalid file path');
  }
  return path.join(TEMPLATES_BASE_PATH, slug, filePath);
}

/**
 * Check if a template exists
 */
export async function templateExists(slug: string): Promise<boolean> {
  try {
    const templatePath = getTemplatePath(slug);
    const stats = await stat(templatePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * List all templates in the templates directory
 */
export async function listTemplates(): Promise<string[]> {
  try {
    await ensureTemplatesDirectory();
    const items = await readdir(TEMPLATES_BASE_PATH, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name);
  } catch {
    return [];
  }
}

/**
 * Read template metadata from meta.json
 */
export async function getTemplateMetadata(slug: string): Promise<TemplateMetadata | null> {
  try {
    const metaPath = getTemplateFilePath(slug, 'meta.json');
    const content = await readFile(metaPath, 'utf-8');
    return JSON.parse(content) as TemplateMetadata;
  } catch {
    return null;
  }
}

/**
 * Save template metadata to meta.json
 */
export async function saveTemplateMetadata(slug: string, metadata: TemplateMetadata): Promise<void> {
  const metaPath = getTemplateFilePath(slug, 'meta.json');
  await writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * Get file tree for a template
 */
export async function getFileTree(slug: string, relativePath: string = ''): Promise<FileTreeNode[]> {
  const basePath = relativePath 
    ? getTemplateFilePath(slug, relativePath)
    : getTemplatePath(slug);
  
  try {
    const items = await readdir(basePath, { withFileTypes: true });
    const tree: FileTreeNode[] = [];
    
    for (const item of items) {
      const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
      const node: FileTreeNode = {
        name: item.name,
        path: itemPath,
        type: item.isDirectory() ? 'directory' : 'file',
      };
      
      if (item.isFile()) {
        node.extension = path.extname(item.name).slice(1);
      } else if (item.isDirectory()) {
        node.children = await getFileTree(slug, itemPath);
      }
      
      tree.push(node);
    }
    
    // Sort: directories first, then files, alphabetically
    return tree.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  } catch {
    return [];
  }
}

/**
 * Read file content from a template
 */
export async function readTemplateFile(slug: string, filePath: string): Promise<string> {
  const fullPath = getTemplateFilePath(slug, filePath);
  return readFile(fullPath, 'utf-8');
}

/**
 * Write file content to a template
 */
export async function writeTemplateFile(slug: string, filePath: string, content: string): Promise<void> {
  const fullPath = getTemplateFilePath(slug, filePath);
  const dir = path.dirname(fullPath);
  
  // Ensure directory exists
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

/**
 * Delete a file from a template
 */
export async function deleteTemplateFile(slug: string, filePath: string): Promise<void> {
  const fullPath = getTemplateFilePath(slug, filePath);
  await unlink(fullPath);
}

/**
 * Create a new template with default structure
 */
export async function createTemplate(slug: string, metadata: TemplateMetadata, allowExisting: boolean = true): Promise<void> {
  if (!validateSlug(slug)) {
    throw new Error('Invalid template slug');
  }
  
  const templatePath = getTemplatePath(slug);
  
  // Check if template already exists on filesystem
  // If allowExisting is true, we'll just update/use the existing folder
  // This handles cases where folder exists but DB record doesn't
  if (await templateExists(slug)) {
    if (!allowExisting) {
      throw new Error('Template already exists');
    }
    // Just update the metadata and continue
    await saveTemplateMetadata(slug, metadata);
    console.log(`[Template] Using existing template folder: ${slug}`);
    return;
  }
  
  // Create directory structure
  const directories = [
    '',
    'sections',
    'templates',
    'assets',
    'pages',
    'layout',
    'config',
    'locales',
  ];
  
  for (const dir of directories) {
    await mkdir(path.join(templatePath, dir), { recursive: true });
  }
  
  // Save metadata
  await saveTemplateMetadata(slug, metadata);
  
  // Create default layout file
  const defaultLayout = `<!doctype html>
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
    
    {{ 'theme.js' | asset_url | script_tag }}
  </body>
</html>`;
  
  await writeTemplateFile(slug, 'layout/theme.liquid', defaultLayout);
  
  // Create default hero section
  const defaultHeroSection = `{% comment %}
  Main Hero Section
  
  Example AI prompts:
  - "Create a hero section with heading, subheading, CTA button, and background image"
  - "Add animation effects to the hero section"
  - "Make the hero section full-width with parallax effect"
{% endcomment %}

<section class="main-hero-section" data-section-id="{{ section.id }}">
  <div class="page-width">
    <div class="main-hero-section__container">
      <h1 class="main-hero-section__heading">
        {{ section.settings.heading | default: 'Welcome to Our Store' }}
      </h1>
      <p class="main-hero-section__subheading">
        {{ section.settings.subheading | default: 'Discover amazing products' }}
      </p>
      {% if section.settings.button_text != blank %}
        <a href="{{ section.settings.button_link }}" class="button main-hero-section__button">
          {{ section.settings.button_text }}
        </a>
      {% endif %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Main Hero",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome to Our Store"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "Discover amazing products"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Shop Now"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button Link"
    },
    {
      "type": "color_scheme",
      "id": "color_scheme",
      "label": "Color scheme",
      "default": "scheme-1"
    }
  ],
  "presets": [
    {
      "name": "Main Hero"
    }
  ]
}
{% endschema %}`;
  
  await writeTemplateFile(slug, 'sections/main-hero.liquid', defaultHeroSection);
  
  // Create default header section
  const defaultHeaderSection = `{% comment %}
  Header Section
  
  Example AI prompts:
  - "Create a responsive header with logo, navigation menu, and cart icon"
  - "Add a sticky header with smooth scroll behavior"
  - "Create a mobile hamburger menu with slide-out navigation"
{% endcomment %}

<header class="header" data-section-id="{{ section.id }}">
  <div class="page-width">
    <div class="header__container">
      <div class="header__logo">
        {% if section.settings.logo != blank %}
          <img src="{{ section.settings.logo | image_url: width: 200 }}" alt="{{ shop.name }}">
        {% else %}
          <a href="{{ routes.root_url }}">{{ shop.name }}</a>
        {% endif %}
      </div>
      
      <nav class="header__nav">
        {% for link in linklists.main-menu.links %}
          <a href="{{ link.url }}" class="header__nav-link">{{ link.title }}</a>
        {% endfor %}
      </nav>
      
      <div class="header__actions">
        <a href="{{ routes.cart_url }}" class="header__cart">
          Cart ({{ cart.item_count }})
        </a>
      </div>
    </div>
  </div>
</header>

{% schema %}
{
  "name": "Header",
  "tag": "header",
  "class": "section-header",
  "settings": [
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Logo"
    }
  ]
}
{% endschema %}`;
  
  await writeTemplateFile(slug, 'sections/header.liquid', defaultHeaderSection);
  
  // Create default footer section
  const defaultFooterSection = `{% comment %}
  Footer Section
  
  Example AI prompts:
  - "Create a footer with multiple columns, links, and social media icons"
  - "Add newsletter signup form to the footer"
  - "Create a footer with payment icons and copyright notice"
{% endcomment %}

<footer class="footer" data-section-id="{{ section.id }}">
  <div class="page-width">
    <div class="footer__container">
      <div class="footer__column">
        <h3 class="footer__heading">{{ section.settings.heading_1 | default: 'About' }}</h3>
        <p>{{ section.settings.text_1 | default: 'About our store' }}</p>
      </div>
      
      <div class="footer__column">
        <h3 class="footer__heading">{{ section.settings.heading_2 | default: 'Quick Links' }}</h3>
        <ul class="footer__links">
          {% for link in linklists.footer.links %}
            <li><a href="{{ link.url }}">{{ link.title }}</a></li>
          {% endfor %}
        </ul>
      </div>
      
      <div class="footer__column">
        <h3 class="footer__heading">{{ section.settings.heading_3 | default: 'Contact' }}</h3>
        <p>{{ section.settings.text_3 | default: 'Contact us' }}</p>
      </div>
    </div>
    
    <div class="footer__bottom">
      <p>&copy; {{ 'now' | date: '%Y' }} {{ shop.name }}. All rights reserved.</p>
    </div>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "tag": "footer",
  "class": "section-footer",
  "settings": [
    {
      "type": "text",
      "id": "heading_1",
      "label": "Column 1 Heading",
      "default": "About"
    },
    {
      "type": "textarea",
      "id": "text_1",
      "label": "Column 1 Text",
      "default": "About our store"
    },
    {
      "type": "text",
      "id": "heading_2",
      "label": "Column 2 Heading",
      "default": "Quick Links"
    },
    {
      "type": "text",
      "id": "heading_3",
      "label": "Column 3 Heading",
      "default": "Contact"
    },
    {
      "type": "textarea",
      "id": "text_3",
      "label": "Column 3 Text",
      "default": "Contact us"
    }
  ]
}
{% endschema %}`;
  
  await writeTemplateFile(slug, 'sections/footer.liquid', defaultFooterSection);
  
  // Create default templates
  const defaultIndexJson = {
    sections: {
      header: {
        type: 'header',
        settings: {}
      },
      main: {
        type: 'main-hero',
        settings: {}
      },
      footer: {
        type: 'footer',
        settings: {}
      }
    },
    order: ['header', 'main', 'footer']
  };
  
  await writeTemplateFile(slug, 'templates/index.json', JSON.stringify(defaultIndexJson, null, 2));
  
  const defaultProductJson = {
    sections: {
      main: {
        type: 'main-product',
        settings: {}
      }
    },
    order: ['main']
  };
  
  await writeTemplateFile(slug, 'templates/product.json', JSON.stringify(defaultProductJson, null, 2));
  
  const defaultCollectionJson = {
    sections: {
      main: {
        type: 'main-collection',
        settings: {}
      }
    },
    order: ['main']
  };
  
  await writeTemplateFile(slug, 'templates/collection.json', JSON.stringify(defaultCollectionJson, null, 2));
  
  // Create default CSS
  const defaultCSS = `/* 
  Base CSS - Custom Styles
  
  Example AI prompts:
  - "Create modern CSS with smooth animations and responsive design"
  - "Create CSS for a minimalist e-commerce theme"
  - "Create CSS with custom color variables and component styles"
*/

:root {
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #ff6b6b;
  --color-background: #ffffff;
  --color-text: #000000;
  --spacing-unit: 1rem;
  --border-radius: 4px;
  --transition-speed: 0.3s;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: 1.6;
}

.page-width {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: var(--color-secondary);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  border: none;
  cursor: pointer;
}

.button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Header Styles */
.header {
  background-color: var(--color-background);
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header__logo a {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: var(--color-primary);
}

.header__nav {
  display: flex;
  gap: 2rem;
}

.header__nav-link {
  text-decoration: none;
  color: var(--color-text);
  transition: color var(--transition-speed);
}

.header__nav-link:hover {
  color: var(--color-accent);
}

.header__cart {
  text-decoration: none;
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius);
}

/* Hero Section Styles */
.main-hero-section {
  padding: 4rem 0;
  text-align: center;
}

.main-hero-section__heading {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.main-hero-section__subheading {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: #666;
}

.main-hero-section__button {
  margin-top: 1rem;
}

/* Footer Styles */
.footer {
  background-color: #f5f5f5;
  padding: 3rem 0 1rem;
  margin-top: 4rem;
}

.footer__container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer__heading {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer__links li {
  margin-bottom: 0.5rem;
}

.footer__links a {
  text-decoration: none;
  color: var(--color-text);
  transition: color var(--transition-speed);
}

.footer__links a:hover {
  color: var(--color-accent);
}

.footer__bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
  color: #666;
}

@media (max-width: 768px) {
  .header__nav {
    display: none;
  }
  
  .main-hero-section__heading {
    font-size: 2rem;
  }
  
  .main-hero-section__subheading {
    font-size: 1rem;
  }
  
  .footer__container {
    grid-template-columns: 1fr;
  }
}`;
  
  await writeTemplateFile(slug, 'assets/base.css', defaultCSS);
  
  // Create default JavaScript
  const defaultJS = `/**
 * Theme JavaScript
 * 
 * Example AI prompts:
 * - "Create JavaScript for smooth scroll animations and lazy loading"
 * - "Create a product variant selector with dynamic price updates"
 * - "Create a cart drawer with add/remove functionality"
 */

(function() {
  'use strict';
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme loaded');
    
    // Add your JavaScript code here
    initTheme();
  });
  
  function initTheme() {
    // Initialize theme functionality
    initMobileMenu();
    initCart();
  }
  
  function initMobileMenu() {
    // Mobile menu functionality
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', function() {
        document.body.classList.toggle('menu-open');
      });
    }
  }
  
  function initCart() {
    // Cart functionality
    // Add cart update handlers here
  }
})();`;
  
  await writeTemplateFile(slug, 'assets/theme.js', defaultJS);
  
  // Create default config files
  const defaultSettingsSchema = {
    name: metadata.name,
    settings: [
      {
        type: 'header',
        content: 'Theme Settings'
      },
      {
        type: 'color',
        id: 'color_primary',
        label: 'Primary Color',
        default: '#000000'
      },
      {
        type: 'color',
        id: 'color_secondary',
        label: 'Secondary Color',
        default: '#ffffff'
      },
      {
        type: 'text',
        id: 'font_family',
        label: 'Font Family',
        default: 'system-ui, sans-serif'
      }
    ]
  };
  
  await writeTemplateFile(slug, 'config/settings_schema.json', JSON.stringify(defaultSettingsSchema, null, 2));
  
  const defaultSettingsData = {
    current: {
      color_primary: '#000000',
      color_secondary: '#ffffff',
      font_family: 'system-ui, sans-serif'
    }
  };
  
  await writeTemplateFile(slug, 'config/settings_data.json', JSON.stringify(defaultSettingsData, null, 2));
  
  // Create default page
  const defaultPage = {
    title: 'Home',
    handle: 'home',
    body_html: '<div class="page-width"><h1>Welcome to Our Store</h1><p>This is the homepage. Use AI to generate rich content for this page.</p></div>',
    published: true,
    template_suffix: ''
  };
  
  await writeTemplateFile(slug, 'pages/home.json', JSON.stringify(defaultPage, null, 2));
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(sourceSlug: string, targetSlug: string): Promise<void> {
  if (!validateSlug(sourceSlug) || !validateSlug(targetSlug)) {
    throw new Error('Invalid template slug');
  }
  
  if (await templateExists(targetSlug)) {
    throw new Error('Target template already exists');
  }
  
  const sourcePath = getTemplatePath(sourceSlug);
  const targetPath = getTemplatePath(targetSlug);
  
  // Recursively copy directory
  await copyDirectory(sourcePath, targetPath);
  
  // Update metadata with new slug
  const metadata = await getTemplateMetadata(targetSlug);
  if (metadata) {
    metadata.id = targetSlug;
    metadata.name = `${metadata.name} (Copy)`;
    metadata.updatedAt = new Date().toISOString().split('T')[0];
    await saveTemplateMetadata(targetSlug, metadata);
  }
}

/**
 * Delete a template (filesystem only - DB record handled separately)
 */
export async function deleteTemplate(slug: string): Promise<void> {
  if (!validateSlug(slug)) {
    throw new Error('Invalid template slug');
  }
  
  const templatePath = getTemplatePath(slug);
  
  if (!await templateExists(slug)) {
    throw new Error('Template does not exist');
  }
  
  await rmdir(templatePath, { recursive: true });
}

/**
 * Get all files in a template (flat list)
 */
export async function getAllTemplateFiles(slug: string): Promise<TemplateFile[]> {
  const files: TemplateFile[] = [];
  
  async function scanDirectory(dirPath: string, relativePath: string = '') {
    const items = await readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        files.push({
          name: item.name,
          path: itemRelativePath,
          type: 'directory',
        });
        await scanDirectory(fullPath, itemRelativePath);
      } else {
        const stats = await stat(fullPath);
        files.push({
          name: item.name,
          path: itemRelativePath,
          type: 'file',
          extension: path.extname(item.name).slice(1),
          size: stats.size,
          modifiedAt: stats.mtime,
        });
      }
    }
  }
  
  const templatePath = getTemplatePath(slug);
  await scanDirectory(templatePath);
  
  return files;
}

/**
 * Helper: Recursively copy a directory
 */
async function copyDirectory(source: string, target: string): Promise<void> {
  await mkdir(target, { recursive: true });
  
  const items = await readdir(source, { withFileTypes: true });
  
  for (const item of items) {
    const sourcePath = path.join(source, item.name);
    const targetPath = path.join(target, item.name);
    
    if (item.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Get files by type (sections, templates, assets, pages, layout, config)
 */
export async function getTemplateFilesByType(slug: string, type: 'sections' | 'templates' | 'assets' | 'pages' | 'layout' | 'config'): Promise<TemplateFile[]> {
  const typePath = getTemplateFilePath(slug, type);
  const files: TemplateFile[] = [];
  
  try {
    const items = await readdir(typePath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isFile()) {
        const fullPath = path.join(typePath, item.name);
        const stats = await stat(fullPath);
        files.push({
          name: item.name,
          path: `${type}/${item.name}`,
          type: 'file',
          extension: path.extname(item.name).slice(1),
          size: stats.size,
          modifiedAt: stats.mtime,
        });
      }
    }
  } catch {
    // Directory might not exist
  }
  
  return files;
}

/**
 * Validate that a template has all required files
 */
export async function validateTemplate(slug: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Check if template exists
  if (!await templateExists(slug)) {
    return { valid: false, errors: ['Template does not exist'] };
  }
  
  // Check for meta.json
  const metadata = await getTemplateMetadata(slug);
  if (!metadata) {
    errors.push('Missing meta.json file');
  }
  
  // Check for templates/index.json
  try {
    await readTemplateFile(slug, 'templates/index.json');
  } catch {
    errors.push('Missing templates/index.json file');
  }
  
  // Check if sections directory exists and has files
  const sections = await getTemplateFilesByType(slug, 'sections');
  if (sections.length === 0) {
    errors.push('No section files found');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

