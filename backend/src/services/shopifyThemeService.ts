import axios, { AxiosError } from 'axios';
import { IStoreConnection } from '../models/StoreConnection';
import { decrypt } from '../utils/encryption';
import * as templateService from './templateService';

export interface ShopifyTheme {
  id: number;
  name: string;
  role: 'main' | 'unpublished' | 'demo';
  theme_store_id: number | null;
  previewable: boolean;
  processing: boolean;
  admin_graphql_api_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyAsset {
  key: string;
  public_url?: string;
  value?: string;
  attachment?: string;
  content_type?: string;
  size?: number;
  checksum?: string;
  theme_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopifyPage {
  id?: number;
  title: string;
  handle: string;
  body_html: string;
  author?: string;
  published?: boolean;
  published_at?: string;
  template_suffix?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApplyTemplateResult {
  success: boolean;
  themeId: number;
  themeName: string;
  assetsUploaded: number;
  pagesCreated: number;
  errors: string[];
}

export interface ApplyTemplateProgress {
  stage: 'fetching_theme' | 'uploading_sections' | 'uploading_templates' | 'uploading_assets' | 'creating_pages' | 'complete';
  current: number;
  total: number;
  message: string;
}

/**
 * Create Shopify API client
 */
function createShopifyClient(storeConnection: IStoreConnection) {
  const accessToken = decrypt(storeConnection.accessToken);
  const apiVersion = storeConnection.apiVersion || '2024-01';
  const baseURL = `https://${storeConnection.shopDomain}/admin/api/${apiVersion}`;
  
  return axios.create({
    baseURL,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

/**
 * Get all themes from the store
 */
export async function getThemes(storeConnection: IStoreConnection): Promise<ShopifyTheme[]> {
  const client = createShopifyClient(storeConnection);
  const response = await client.get('/themes.json');
  return response.data.themes;
}

/**
 * Get the active (main) theme
 */
export async function getActiveTheme(storeConnection: IStoreConnection): Promise<ShopifyTheme | null> {
  const themes = await getThemes(storeConnection);
  return themes.find(theme => theme.role === 'main') || null;
}

/**
 * Get a specific theme by ID
 */
export async function getTheme(storeConnection: IStoreConnection, themeId: number): Promise<ShopifyTheme> {
  const client = createShopifyClient(storeConnection);
  const response = await client.get(`/themes/${themeId}.json`);
  return response.data.theme;
}

/**
 * Set a theme as the main (default) theme
 */
export async function setThemeAsMain(
  storeConnection: IStoreConnection,
  themeId: number
): Promise<ShopifyTheme> {
  const client = createShopifyClient(storeConnection);
  
  console.log(`[Set Theme as Main] Setting theme ${themeId} as main theme`);
  
  // First, get all themes to find the current main theme
  const themes = await getThemes(storeConnection);
  const currentMainTheme = themes.find(theme => theme.role === 'main');
  const targetTheme = themes.find(theme => theme.id === themeId);
  
  if (!targetTheme) {
    throw new Error(`Theme with ID ${themeId} not found`);
  }
  
  console.log(`[Set Theme as Main] Current main theme: ${currentMainTheme?.id} (${currentMainTheme?.name})`);
  console.log(`[Set Theme as Main] Target theme: ${targetTheme.id} (${targetTheme.name}), current role: ${targetTheme.role}`);
  
  // If there's a current main theme and it's different, set it to unpublished
  if (currentMainTheme && currentMainTheme.id !== themeId) {
    try {
      console.log(`[Set Theme as Main] Unpublishing previous main theme ${currentMainTheme.id}`);
      const unpublishResponse = await client.put(`/themes/${currentMainTheme.id}.json`, {
        theme: {
          role: 'unpublished',
        },
      });
      console.log(`[Set Theme as Main] Successfully unpublished theme ${currentMainTheme.id}`);
    } catch (error: any) {
      console.error(`[Set Theme as Main] Failed to unpublish previous main theme ${currentMainTheme.id}:`, error.message);
      // Continue anyway - sometimes this fails but setting the new one still works
    }
  }
  
  // Set the new theme as main
  console.log(`[Set Theme as Main] Setting theme ${themeId} as main...`);
  try {
    const response = await client.put(`/themes/${themeId}.json`, {
      theme: {
        role: 'main',
      },
    });
    
    const updatedTheme = response.data.theme;
    console.log(`[Set Theme as Main] API Response - Theme ${themeId} (${updatedTheme.name}), role: ${updatedTheme.role}`);
    
    // Wait a moment for Shopify to process the change
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify the change by fetching themes again (with retries)
    let verifiedMain = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && (!verifiedMain || verifiedMain.id !== themeId)) {
      attempts++;
      console.log(`[Set Theme as Main] Verification attempt ${attempts}/${maxAttempts}...`);
      
      const verifyThemes = await getThemes(storeConnection);
      verifiedMain = verifyThemes.find(theme => theme.role === 'main');
      console.log(`[Set Theme as Main] Verification: Main theme is ${verifiedMain?.id} (${verifiedMain?.name})`);
      
      if (verifiedMain?.id === themeId) {
        console.log(`[Set Theme as Main] ✅ Successfully verified theme ${themeId} is now the main theme`);
        break;
      }
      
      if (attempts < maxAttempts) {
        console.log(`[Set Theme as Main] Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (verifiedMain?.id !== themeId) {
      const errorMsg = `Theme role change verification failed. Expected ${themeId}, but main theme is ${verifiedMain?.id}. The API call succeeded but the change may not have taken effect.`;
      console.error(`[Set Theme as Main] ❌ ${errorMsg}`);
      // Still return the updated theme from the API response, but log the warning
      console.warn(`[Set Theme as Main] Returning theme from API response, but verification failed`);
    }
    
    return updatedTheme;
  } catch (error: any) {
    console.error(`[Set Theme as Main] Failed to set theme ${themeId} as main:`, error.message);
    if (error.response) {
      console.error(`[Set Theme as Main] Response status: ${error.response.status}`);
      console.error(`[Set Theme as Main] Response data:`, error.response.data);
    }
    throw new Error(`Failed to set theme as main: ${error.message}`);
  }
}

/**
 * Upload or update an asset to a theme
 */
export async function uploadAsset(
  storeConnection: IStoreConnection,
  themeId: number,
  key: string,
  value: string
): Promise<ShopifyAsset> {
  const client = createShopifyClient(storeConnection);
  
  const response = await client.put(`/themes/${themeId}/assets.json`, {
    asset: {
      key,
      value,
    },
  });
  
  return response.data.asset;
}

/**
 * Upload a binary asset (image, etc.) using base64
 */
export async function uploadBinaryAsset(
  storeConnection: IStoreConnection,
  themeId: number,
  key: string,
  attachment: string // base64 encoded
): Promise<ShopifyAsset> {
  const client = createShopifyClient(storeConnection);
  
  const response = await client.put(`/themes/${themeId}/assets.json`, {
    asset: {
      key,
      attachment,
    },
  });
  
  return response.data.asset;
}

/**
 * Get an asset from a theme
 */
export async function getAsset(
  storeConnection: IStoreConnection,
  themeId: number,
  key: string
): Promise<ShopifyAsset | null> {
  const client = createShopifyClient(storeConnection);
  
  try {
    const response = await client.get(`/themes/${themeId}/assets.json`, {
      params: { 'asset[key]': key },
    });
    return response.data.asset;
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete an asset from a theme
 */
export async function deleteAsset(
  storeConnection: IStoreConnection,
  themeId: number,
  key: string
): Promise<void> {
  const client = createShopifyClient(storeConnection);
  
  await client.delete(`/themes/${themeId}/assets.json`, {
    params: { 'asset[key]': key },
  });
}

/**
 * List all assets in a theme
 */
export async function listAssets(
  storeConnection: IStoreConnection,
  themeId: number
): Promise<ShopifyAsset[]> {
  const client = createShopifyClient(storeConnection);
  const response = await client.get(`/themes/${themeId}/assets.json`);
  return response.data.assets;
}

/**
 * Create a page
 */
export async function createPage(
  storeConnection: IStoreConnection,
  page: ShopifyPage
): Promise<ShopifyPage> {
  const client = createShopifyClient(storeConnection);
  
  const response = await client.post('/pages.json', { page });
  return response.data.page;
}

/**
 * Update a page
 */
export async function updatePage(
  storeConnection: IStoreConnection,
  pageId: number,
  page: Partial<ShopifyPage>
): Promise<ShopifyPage> {
  const client = createShopifyClient(storeConnection);
  
  const response = await client.put(`/pages/${pageId}.json`, { page });
  return response.data.page;
}

/**
 * Get a page by handle
 */
export async function getPageByHandle(
  storeConnection: IStoreConnection,
  handle: string
): Promise<ShopifyPage | null> {
  const client = createShopifyClient(storeConnection);
  
  try {
    const response = await client.get('/pages.json', {
      params: { handle },
    });
    const pages = response.data.pages;
    return pages.length > 0 ? pages[0] : null;
  } catch {
    return null;
  }
}

/**
 * List all pages
 */
export async function listPages(storeConnection: IStoreConnection): Promise<ShopifyPage[]> {
  const client = createShopifyClient(storeConnection);
  const response = await client.get('/pages.json');
  return response.data.pages;
}

/**
 * Apply a template to a user's Shopify store
 */
export async function applyTemplate(
  storeConnection: IStoreConnection,
  templateSlug: string,
  onProgress?: (progress: ApplyTemplateProgress) => void
): Promise<ApplyTemplateResult> {
  const errors: string[] = [];
  let assetsUploaded = 0;
  let pagesCreated = 0;
  
  // Report progress helper
  const reportProgress = (progress: ApplyTemplateProgress) => {
    if (onProgress) {
      onProgress(progress);
    }
  };
  
  // Step 1: Validate template exists
  const templateExists = await templateService.templateExists(templateSlug);
  if (!templateExists) {
    throw new Error(`Template "${templateSlug}" does not exist`);
  }
  
  // Step 2: Get active theme
  reportProgress({
    stage: 'fetching_theme',
    current: 0,
    total: 1,
    message: 'Fetching active theme...',
  });
  
  const activeTheme = await getActiveTheme(storeConnection);
  if (!activeTheme) {
    throw new Error('No active theme found in the store');
  }
  
  const themeId = activeTheme.id;
  
  // Step 3: Upload sections
  reportProgress({
    stage: 'uploading_sections',
    current: 0,
    total: 0,
    message: 'Uploading section files...',
  });
  
  const sections = await templateService.getTemplateFilesByType(templateSlug, 'sections');
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    reportProgress({
      stage: 'uploading_sections',
      current: i + 1,
      total: sections.length,
      message: `Uploading section: ${section.name}`,
    });
    
    try {
      const content = await templateService.readTemplateFile(templateSlug, section.path);
      await uploadAsset(storeConnection, themeId, `sections/${section.name}`, content);
      assetsUploaded++;
      
      // Rate limiting - Shopify allows 2 requests per second for assets
      await delay(500);
    } catch (error: any) {
      errors.push(`Failed to upload section ${section.name}: ${error.message}`);
    }
  }
  
  // Step 4: Upload templates (JSON files)
  reportProgress({
    stage: 'uploading_templates',
    current: 0,
    total: 0,
    message: 'Uploading template files...',
  });
  
  const templates = await templateService.getTemplateFilesByType(templateSlug, 'templates');
  
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    reportProgress({
      stage: 'uploading_templates',
      current: i + 1,
      total: templates.length,
      message: `Uploading template: ${template.name}`,
    });
    
    try {
      const content = await templateService.readTemplateFile(templateSlug, template.path);
      await uploadAsset(storeConnection, themeId, `templates/${template.name}`, content);
      assetsUploaded++;
      
      await delay(500);
    } catch (error: any) {
      errors.push(`Failed to upload template ${template.name}: ${error.message}`);
    }
  }
  
  // Step 5: Upload layout files
  reportProgress({
    stage: 'uploading_assets',
    current: 0,
    total: 0,
    message: 'Uploading layout files...',
  });
  
  const layouts = await templateService.getTemplateFilesByType(templateSlug, 'layout');
  
  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    reportProgress({
      stage: 'uploading_assets',
      current: i + 1,
      total: layouts.length,
      message: `Uploading layout: ${layout.name}`,
    });
    
    try {
      const content = await templateService.readTemplateFile(templateSlug, layout.path);
      await uploadAsset(storeConnection, themeId, `layout/${layout.name}`, content);
      assetsUploaded++;
      
      await delay(500);
    } catch (error: any) {
      errors.push(`Failed to upload layout ${layout.name}: ${error.message}`);
    }
  }
  
  // Step 6: Upload config files
  reportProgress({
    stage: 'uploading_assets',
    current: 0,
    total: 0,
    message: 'Uploading config files...',
  });
  
  const configs = await templateService.getTemplateFilesByType(templateSlug, 'config');
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    reportProgress({
      stage: 'uploading_assets',
      current: i + 1,
      total: configs.length,
      message: `Uploading config: ${config.name}`,
    });
    
    try {
      const content = await templateService.readTemplateFile(templateSlug, config.path);
      await uploadAsset(storeConnection, themeId, `config/${config.name}`, content);
      assetsUploaded++;
      
      await delay(500);
    } catch (error: any) {
      errors.push(`Failed to upload config ${config.name}: ${error.message}`);
    }
  }
  
  // Step 7: Upload assets (CSS, JS, images)
  reportProgress({
    stage: 'uploading_assets',
    current: 0,
    total: 0,
    message: 'Uploading asset files...',
  });
  
  const assets = await templateService.getTemplateFilesByType(templateSlug, 'assets');
  
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    reportProgress({
      stage: 'uploading_assets',
      current: i + 1,
      total: assets.length,
      message: `Uploading asset: ${asset.name}`,
    });
    
    try {
      const content = await templateService.readTemplateFile(templateSlug, asset.path);
      const assetKey = `assets/${asset.name}`;
      
      // Check if it's a binary file (image, etc.)
      const isImage = /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(asset.name);
      
      if (isImage && content.startsWith('data:')) {
        // Base64 encoded image
        await uploadBinaryAsset(storeConnection, themeId, assetKey, content);
      } else {
        // Text file (CSS, JS, etc.)
        await uploadAsset(storeConnection, themeId, assetKey, content);
      }
      assetsUploaded++;
      
      await delay(500);
    } catch (error: any) {
      errors.push(`Failed to upload asset ${asset.name}: ${error.message}`);
    }
  }
  
  // Step 8: Create pages
  reportProgress({
    stage: 'creating_pages',
    current: 0,
    total: 0,
    message: 'Creating pages...',
  });
  
  const pages = await templateService.getTemplateFilesByType(templateSlug, 'pages');
  
  for (let i = 0; i < pages.length; i++) {
    const pageFile = pages[i];
    reportProgress({
      stage: 'creating_pages',
      current: i + 1,
      total: pages.length,
      message: `Creating page: ${pageFile.name}`,
    });
    
    try {
      const content = await templateService.readTemplateFile(templateSlug, pageFile.path);
      const pageData = JSON.parse(content) as ShopifyPage;
      
      // Check if page already exists
      const existingPage = await getPageByHandle(storeConnection, pageData.handle);
      
      if (existingPage && existingPage.id) {
        // Update existing page
        await updatePage(storeConnection, existingPage.id, {
          title: pageData.title,
          body_html: pageData.body_html,
          template_suffix: pageData.template_suffix,
        });
      } else {
        // Create new page
        await createPage(storeConnection, pageData);
        pagesCreated++;
      }
      
      await delay(300);
    } catch (error: any) {
      errors.push(`Failed to create page ${pageFile.name}: ${error.message}`);
    }
  }
  
  // Complete
  reportProgress({
    stage: 'complete',
    current: 1,
    total: 1,
    message: 'Template applied successfully!',
  });
  
  return {
    success: errors.length === 0,
    themeId,
    themeName: activeTheme.name,
    assetsUploaded,
    pagesCreated,
    errors,
  };
}

/**
 * Preview what will be applied from a template
 */
export async function previewTemplateApplication(templateSlug: string): Promise<{
  sections: string[];
  templates: string[];
  assets: string[];
  pages: string[];
  layouts: string[];
  configs: string[];
}> {
  const sections = await templateService.getTemplateFilesByType(templateSlug, 'sections');
  const templates = await templateService.getTemplateFilesByType(templateSlug, 'templates');
  const assets = await templateService.getTemplateFilesByType(templateSlug, 'assets');
  const pages = await templateService.getTemplateFilesByType(templateSlug, 'pages');
  const layouts = await templateService.getTemplateFilesByType(templateSlug, 'layout');
  const configs = await templateService.getTemplateFilesByType(templateSlug, 'config');
  
  return {
    sections: sections.map(s => s.name),
    templates: templates.map(t => t.name),
    assets: assets.map(a => a.name),
    pages: pages.map(p => p.name.replace('.json', '')),
    layouts: layouts.map(l => l.name),
    configs: configs.map(c => c.name),
  };
}

/**
 * Helper: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

