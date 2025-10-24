import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';

/**
 * GET /api/public/view/[publicLinkId]
 * Get a public view by its public link ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { publicLinkId: string } }
) {
  try {
    const db = getDBAdapter();
    const view = await db.getViewByPublicLink(params.publicLinkId);

    if (!view || !view.is_public) {
      return NextResponse.json(
        { success: false, error: 'View not found or not public' },
        { status: 404 }
      );
    }

    // Increment access count
    await db.incrementViewAccessCount(view.id);

    // Parse filter config if it's a string
    const filterConfig = typeof view.filter_config === 'string'
      ? JSON.parse(view.filter_config)
      : view.filter_config;

    // For snapshot views, return the saved data
    if (view.view_type === 'snapshot' && view.snapshot_data) {
      const snapshotData = Array.isArray(view.snapshot_data)
        ? view.snapshot_data
        : JSON.parse(JSON.stringify(view.snapshot_data));

      return NextResponse.json({
        success: true,
        view: {
          id: view.id,
          name: view.name,
          description: view.description,
          view_type: view.view_type,
          created_at: view.created_at,
          access_count: view.access_count,
          filter_config: filterConfig,
        },
        data: snapshotData,
      });
    }

    // For filters_only views, return just the filter config
    // The client will need to apply these filters to their own data
    return NextResponse.json({
      success: true,
      view: {
        id: view.id,
        name: view.name,
        description: view.description,
        view_type: view.view_type,
        created_at: view.created_at,
        access_count: view.access_count,
        filter_config: filterConfig,
        session_id: view.session_id,
      },
      message: view.session_id
        ? 'This view is linked to a specific session. Load the session and apply the filters.'
        : 'This view contains filter configuration only. Apply to your own data.',
    });
  } catch (error) {
    console.error('Error fetching public view:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch public view',
      },
      { status: 500 }
    );
  }
}
