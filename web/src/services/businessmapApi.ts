import { filterCards, type RawBusinessmapCard } from './cardSearch';
import type { BusinessmapBoard, BusinessmapCard, BusinessmapColumn, BusinessmapCustomField, BusinessmapLane, CardQuery } from '@/types/businessmap';

export interface BusinessmapCredentials {
  subdomain: string;
  apiKey: string;
}

export class BusinessmapApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'BusinessmapApiError';
  }
}

interface ListResponse<T> {
  data: T[];
}

/** Build the Businessmap REST base URL for a workspace subdomain.
 *
 * @param subdomain - Workspace subdomain without protocol or domain suffix.
 * @returns HTTPS base URL for the tenant.
 */
function baseUrl(subdomain: string): string {
  return `https://${subdomain.trim()}.businessmap.io`;
}

/** Map an HTTP status code to a user-facing BusinessmapApiError.
 *
 * @param status - HTTP response status.
 * @returns Typed error with an appropriate message.
 */
function mapError(status: number): BusinessmapApiError {
  if (status === 401 || status === 403) {
    return new BusinessmapApiError('Invalid Businessmap API key or subdomain', status);
  }
  if (status === 429) {
    return new BusinessmapApiError('Too many requests to Businessmap — wait a moment and try again', status);
  }
  return new BusinessmapApiError(`Businessmap API request failed (${status})`, status);
}

/** Perform an authenticated GET against the Businessmap API.
 *
 * @param credentials - Subdomain and API key from the facilitator browser.
 * @param path - API path starting with /api/v2.
 * @param query - Optional query string parameters.
 * @returns Parsed JSON response body.
 * @returns Rejects with BusinessmapApiError when the request fails.
 */
async function bmGet<T>(
  credentials: BusinessmapCredentials,
  path: string,
  query?: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(`${baseUrl(credentials.subdomain)}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      apikey: credentials.apiKey,
    },
  });

  if (!res.ok) {
    throw mapError(res.status);
  }

  return res.json() as Promise<T>;
}

/** Perform an authenticated write request against the Businessmap API.
 *
 * @param credentials - Subdomain and API key from the facilitator browser.
 * @param method - HTTP write verb.
 * @param path - API path starting with /api/v2.
 * @param body - JSON-serializable request body.
 * @returns Parsed JSON response body, or undefined for 204 responses.
 * @returns Rejects with BusinessmapApiError when the request fails.
 */
async function bmWrite<T>(
  credentials: BusinessmapCredentials,
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl(credentials.subdomain)}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: credentials.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw mapError(res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** Map a Businessmap board payload to the app board type.
 *
 * @param raw - Raw board object from the API.
 * @returns Normalized board.
 */
function mapBoard(raw: { board_id: number; name: string }): BusinessmapBoard {
  return { boardId: raw.board_id, name: raw.name };
}

/** Map a Businessmap column payload to the app column type.
 *
 * @param raw - Raw column object from the API.
 * @returns Normalized column.
 */
function mapColumn(raw: { column_id: number; name: string; section: number }): BusinessmapColumn {
  return { columnId: raw.column_id, name: raw.name, section: raw.section };
}

/** Map a Businessmap lane payload to the app lane type.
 *
 * @param raw - Raw lane object from the API.
 * @returns Normalized lane.
 */
function mapLane(raw: { lane_id: number; name: string }): BusinessmapLane {
  return { laneId: raw.lane_id, name: raw.name };
}

/** Map a Businessmap custom field payload to the app custom field type.
 *
 * @param raw - Raw custom field object from the API.
 * @returns Normalized custom field including allowed values when present.
 */
function mapCustomField(raw: {
  field_id: number;
  name: string;
  type: string;
  allowed_values?: { value_id: number; value: string }[];
}): BusinessmapCustomField {
  return {
    fieldId: raw.field_id,
    name: raw.name,
    type: raw.type,
    allowedValues: raw.allowed_values?.map((v) => ({
      valueId: v.value_id,
      value: v.value,
    })),
  };
}

/** Map a raw Businessmap card to the app card type.
 *
 * @param raw - Raw card object from search or list responses.
 * @returns Normalized card for UI and queue building.
 */
function mapCard(raw: RawBusinessmapCard): BusinessmapCard {
  return {
    cardId: raw.card_id,
    customId: raw.custom_id,
    title: raw.title,
    description: raw.description,
    boardId: raw.board_id,
    columnId: raw.column_id,
    laneId: raw.lane_id,
    color: raw.color ?? '64748b',
    tags: raw.tags?.map((t) => t.name),
  };
}

export async function listBoards(credentials: BusinessmapCredentials): Promise<BusinessmapBoard[]> {
  const res = await bmGet<ListResponse<{ board_id: number; name: string }>>(
    credentials,
    '/api/v2/boards',
  );
  return res.data.map(mapBoard);
}

export async function listColumns(
  credentials: BusinessmapCredentials,
  boardId: number,
): Promise<BusinessmapColumn[]> {
  const res = await bmGet<ListResponse<{ column_id: number; name: string; section: number }>>(
    credentials,
    `/api/v2/boards/${boardId}/columns`,
  );
  return res.data.map(mapColumn);
}

export async function listLanes(
  credentials: BusinessmapCredentials,
  boardId: number,
): Promise<BusinessmapLane[]> {
  const res = await bmGet<ListResponse<{ lane_id: number; name: string }>>(
    credentials,
    `/api/v2/boards/${boardId}/lanes`,
  );
  return res.data.map(mapLane);
}

export async function listCustomFields(
  credentials: BusinessmapCredentials,
  types = 'number,dropdown',
): Promise<BusinessmapCustomField[]> {
  const res = await bmGet<
    ListResponse<{
      field_id: number;
      name: string;
      type: string;
      allowed_values?: { value_id: number; value: string }[];
    }>
  >(credentials, '/api/v2/customFields', { types });
  return res.data.map(mapCustomField);
}

export async function searchCards(
  credentials: BusinessmapCredentials,
  query: CardQuery,
): Promise<BusinessmapCard[]> {
  if (!query.boardId) return [];

  const needsExpand = Boolean(query.tagFilter?.trim());
  const params: Record<string, string> = {
    board_ids: String(query.boardId),
    state: 'active',
    page: '1',
    per_page: '100',
  };

  if (query.columnIds.length) {
    params.column_ids = query.columnIds.join(',');
  }
  if (query.laneIds.length) {
    params.lane_ids = query.laneIds.join(',');
  }
  if (needsExpand) {
    params.expand = 'tags';
  }

  const res = await bmGet<{
    data: {
      data: RawBusinessmapCard[];
    };
  }>(credentials, '/api/v2/cards', params);

  const filtered = filterCards(res.data.data, query);
  return filtered.map(mapCard);
}

/** Lightweight connectivity check — facilitator browser → Businessmap. */
export async function testBusinessmapConnection(
  credentials: BusinessmapCredentials,
): Promise<boolean> {
  await listBoards(credentials);
  return true;
}

export function updateCardCustomField(
  credentials: BusinessmapCredentials,
  cardId: number,
  fieldId: number,
  payload: { value: number } | { values: { value_id: number }[] },
): Promise<void> {
  return bmWrite<void>(
    credentials,
    'POST',
    `/api/v2/cards/${cardId}/customFields/${fieldId}`,
    payload,
  );
}

export function updateCardNativeSize(
  credentials: BusinessmapCredentials,
  cardId: number,
  size: number,
): Promise<void> {
  return bmWrite<void>(credentials, 'PUT', `/api/v2/cards/${cardId}`, { size });
}
