import { apiClient } from './client';
import { Interpretation, InterpretationType } from './captures';

/**
 * The user's verdict on a proposal.
 *
 * `accepted` takes it as-is and `edited` takes it with changes applied -- both
 * are affirmative, and both produce a Task when the resulting type is
 * actionable. `dismissed` produces nothing and withdraws a Task an earlier
 * acceptance created, so accepting is never a one-way door.
 *
 * Field changes are only valid alongside `edited`; sending them with
 * `accepted` is rejected by the API rather than silently recorded.
 */
export type Decision = 'accepted' | 'edited' | 'dismissed';

export interface InterpretationDecision {
  status: Decision;
  type?: InterpretationType;
  suggested_title?: string;
  /** 0 clears the association. */
  suggested_project_id?: number;
  suggested_priority?: string;
  suggested_next_action?: string;
}

interface RawInterpretation {
  id: number;
  capture_id: number;
  type: InterpretationType;
  suggested_title?: string | null;
  suggested_project_id?: number | null;
  suggested_priority?: string | null;
  suggested_next_action?: string | null;
  confidence?: number | null;
  status: Interpretation['status'];
  model?: string | null;
  created_at: string;
}

export const interpretationsApi = {
  decide: async (
    id: number,
    decision: InterpretationDecision
  ): Promise<Interpretation> => {
    const body: Record<string, unknown> = { status: decision.status };
    if (decision.type !== undefined) body.type = decision.type;
    if (decision.suggested_title !== undefined) {
      body.suggested_title = decision.suggested_title;
    }
    if (decision.suggested_project_id !== undefined) {
      body.suggested_project_id = decision.suggested_project_id;
    }
    if (decision.suggested_priority !== undefined) {
      body.suggested_priority = decision.suggested_priority;
    }
    if (decision.suggested_next_action !== undefined) {
      body.suggested_next_action = decision.suggested_next_action;
    }
    const { data } = await apiClient.patch<RawInterpretation>(
      `/interpretations/${id}`,
      body
    );
    return {
      id: data.id,
      capture_id: data.capture_id,
      type: data.type,
      suggested_title: data.suggested_title ?? undefined,
      suggested_project_id: data.suggested_project_id ?? undefined,
      suggested_priority: data.suggested_priority ?? undefined,
      suggested_next_action: data.suggested_next_action ?? undefined,
      confidence: data.confidence ?? undefined,
      status: data.status,
      model: data.model ?? undefined,
      created_at: String(data.created_at),
    };
  },
};
