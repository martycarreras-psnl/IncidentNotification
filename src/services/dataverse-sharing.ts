// Native Dataverse record-sharing plumbing for incidents.
//
// The Power Apps SDK exposes Dataverse system messages through the data client's
// executeAsync({ dataverseRequest: { action: 'customapi', ... } }) path, but only
// for operations registered in the data source's `apis` map. The generated
// dataSourcesInfo ships an empty `apis: {}` for Dataverse tables, so we inject the
// three sharing messages we need into the incident data source here. The runtime
// data-source singleton holds the same object reference, so this one-time mutation
// is visible to executeAsync.
//
// Messages used (Dataverse Web API):
//   - GrantAccess  / ModifyAccess  (POST unbound actions)
//   - RevokeAccess                 (POST unbound action)
//   - RetrieveSharedPrincipalsAndAccess (GET unbound function with Target alias)

import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';
import type { AccessRight } from '@/types/domain-models';

const INCIDENT_DS = 'msftirma_incidents'; // data source key / entity set name
const INCIDENT_ENTITY = 'msftirma_incident'; // entity logical name
const INCIDENT_ID = 'msftirma_incidentid'; // primary key column
const API = 'api/data/v9.0/';

// Build the RetrieveSharedPrincipalsAndAccess function URL with the Target alias.
// encodeURIComponent the JSON alias value but keep the `{id}` placeholder literal
// so the SDK's path-parameter substitution can replace it with the record id.
const aliasJson = `{"@odata.id":"${INCIDENT_DS}(__ID__)"}`;
const retrieveSharedPath =
  `${API}RetrieveSharedPrincipalsAndAccess(Target=@p1)?@p1=${encodeURIComponent(aliasJson)}`.replace(
    '__ID__',
    '{id}',
  );

const SHARING_APIS = {
  GrantAccess: {
    path: `${API}GrantAccess`,
    method: 'POST',
    parameters: [
      { name: 'Target', in: 'body', required: true, type: 'object' },
      { name: 'PrincipalAccess', in: 'body', required: true, type: 'object' },
    ],
  },
  ModifyAccess: {
    path: `${API}ModifyAccess`,
    method: 'POST',
    parameters: [
      { name: 'Target', in: 'body', required: true, type: 'object' },
      { name: 'PrincipalAccess', in: 'body', required: true, type: 'object' },
    ],
  },
  RevokeAccess: {
    path: `${API}RevokeAccess`,
    method: 'POST',
    parameters: [
      { name: 'Target', in: 'body', required: true, type: 'object' },
      { name: 'Revokee', in: 'body', required: true, type: 'object' },
    ],
  },
  RetrieveSharedPrincipalsAndAccess: {
    path: retrieveSharedPath,
    method: 'GET',
    parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
  },
};

// Register the sharing messages on the incident data source (idempotent).
const dsMap = dataSourcesInfo as unknown as Record<string, { apis: Record<string, unknown> }>;
const incidentApis = dsMap[INCIDENT_DS]?.apis;
if (incidentApis && !('GrantAccess' in incidentApis)) {
  Object.assign(incidentApis, SHARING_APIS);
}

const client = getClient(dataSourcesInfo);

const KNOWN_ACCESS_RIGHTS: readonly AccessRight[] = [
  'ReadAccess',
  'WriteAccess',
  'AppendAccess',
  'AppendToAccess',
  'CreateAccess',
  'DeleteAccess',
  'ShareAccess',
  'AssignAccess',
];

function parseAccessMask(mask: unknown): AccessRight[] {
  if (typeof mask !== 'string') return [];
  return mask
    .split(',')
    .map((p) => p.trim())
    .filter((p): p is AccessRight => (KNOWN_ACCESS_RIGHTS as readonly string[]).includes(p));
}

function userTarget(incidentId: string) {
  return {
    [INCIDENT_ID]: incidentId,
    '@odata.type': `Microsoft.Dynamics.CRM.${INCIDENT_ENTITY}`,
  };
}

function userPrincipal(principalId: string) {
  return {
    systemuserid: principalId,
    '@odata.type': 'Microsoft.Dynamics.CRM.systemuser',
  };
}

type ExecResult = { success?: boolean; data?: unknown; error?: { message?: string } | Error };

function ensureOk(result: ExecResult, operation: string): void {
  if (result && result.success === false) {
    const message =
      (result.error && 'message' in result.error && result.error.message) ||
      `Dataverse ${operation} failed.`;
    throw new Error(message);
  }
}

async function exec(operationName: string, body: unknown): Promise<ExecResult> {
  return (await client.executeAsync({
    dataverseRequest: {
      action: 'customapi',
      parameters: { operationName, tableName: INCIDENT_DS, body },
    },
  } as never)) as ExecResult;
}

/** Share an incident with a user. Falls back to ModifyAccess if already shared. */
export async function grantAccess(
  incidentId: string,
  principalId: string,
  access: AccessRight[],
): Promise<void> {
  const body = {
    Target: userTarget(incidentId),
    PrincipalAccess: { AccessMask: access.join(','), Principal: userPrincipal(principalId) },
  };
  const result = await exec('GrantAccess', body);
  if (result && result.success === false) {
    // GrantAccess errors when the principal already has a share — upgrade instead.
    const modified = await exec('ModifyAccess', body);
    ensureOk(modified, 'ModifyAccess');
  }
}

/** Remove all sharing access for a principal on an incident. */
export async function revokeAccess(incidentId: string, principalId: string): Promise<void> {
  const result = await exec('RevokeAccess', {
    Target: userTarget(incidentId),
    Revokee: userPrincipal(principalId),
  });
  ensureOk(result, 'RevokeAccess');
}

export interface RawShare {
  principalId: string;
  principalType: 'systemuser' | 'team';
  access: AccessRight[];
}

interface RawPrincipalAccess {
  AccessMask?: string;
  Principal?: { ownerid?: string; systemuserid?: string; teamid?: string; '@odata.type'?: string };
}

/** Principals (and their access) the incident has been shared with. */
export async function retrieveShares(incidentId: string): Promise<RawShare[]> {
  const result = await exec('RetrieveSharedPrincipalsAndAccess', { id: incidentId });
  ensureOk(result, 'RetrieveSharedPrincipalsAndAccess');
  const data = result.data as { PrincipalAccesses?: RawPrincipalAccess[] } | undefined;
  const list = data?.PrincipalAccesses ?? [];
  return list
    .map<RawShare>((pa) => {
      const principal = pa.Principal ?? {};
      const isTeam = (principal['@odata.type'] ?? '').toLowerCase().includes('team');
      const principalId = String(
        principal.ownerid ?? principal.systemuserid ?? principal.teamid ?? '',
      );
      return {
        principalId,
        principalType: isTeam ? 'team' : 'systemuser',
        access: parseAccessMask(pa.AccessMask),
      };
    })
    .filter((s) => s.principalId);
}
