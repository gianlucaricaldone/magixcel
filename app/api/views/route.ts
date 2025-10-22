import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { IFilterConfig, ViewType } from '@/types';
import { nanoid } from 'nanoid';

/**
 * GET /api/views
 * List all views (optionally filtered by category or sessionId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;
    const workspaceId = searchParams.get('workspaceId') || undefined;

    let views = await db.listViews(sessionId, category);

    // Filter by workspace if provided (views are GLOBAL to workspace)
    if (workspaceId) {
      views = views.filter((view) => view.workspace_id === workspaceId);
    }

    return NextResponse.json({
      success: true,
      views,
    });
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch views',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/views
 * Create a new view (filters_only or snapshot)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      workspaceId,
      sessionId,
      filterConfig,
      viewType = 'filters_only',
      snapshotData,
      isPublic = false,
    } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!filterConfig || !filterConfig.filters || !filterConfig.combinator) {
      return NextResponse.json(
        { success: false, error: 'Invalid filter configuration' },
        { status: 400 }
      );
    }

    if (!['filters_only', 'snapshot'].includes(viewType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid view type. Must be "filters_only" or "snapshot"' },
        { status: 400 }
      );
    }

    // For snapshot views, snapshot data is required
    if (viewType === 'snapshot' && !snapshotData) {
      return NextResponse.json(
        { success: false, error: 'Snapshot data is required for snapshot views' },
        { status: 400 }
      );
    }

    // Limit snapshot data size (10MB)
    if (snapshotData) {
      const dataSize = JSON.stringify(snapshotData).length;
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (dataSize > maxSize) {
        return NextResponse.json(
          { success: false, error: 'Snapshot data exceeds 10MB limit' },
          { status: 413 }
        );
      }
    }

    // Check if name already exists
    const existing = await db.getViewByName(name);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A view with this name already exists' },
        { status: 409 }
      );
    }

    // Generate public link ID if public
    const publicLinkId = isPublic ? nanoid(10) : undefined;

    // Create view (GLOBAL to workspace, not tied to a specific sheet)
    const view = await db.createView({
      name,
      description: description || '',
      category: category || 'Custom',
      workspace_id: workspaceId,
      session_id: sessionId, // REQUIRED: Every view must be linked to a session
      filter_config: JSON.stringify(filterConfig),
      view_type: viewType as ViewType,
      snapshot_data: snapshotData ? JSON.stringify(snapshotData) : undefined,
      is_public: isPublic,
      public_link_id: publicLinkId,
    });

    // Return view with public link if applicable
    const response: any = {
      success: true,
      view,
    };

    if (isPublic && publicLinkId) {
      response.publicLink = `/public/view/${publicLinkId}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating view:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create view',
      },
      { status: 500 }
    );
  }
}
