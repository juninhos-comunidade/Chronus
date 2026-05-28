import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { DbOrTx } from '@/db/transaction'
import type { ListResponse, PaginationParams } from '@/shared/types/query.types'
import type {
  CreateWorkspaceDTO, UpdateWorkspaceDTO, WorkspaceResponseDTO,
  WorkspaceMemberResponseDTO, InviteMemberDTO, InviteResponseDTO,
  UpdateMemberRoleDTO,
} from '../dtos/workspace.dto'

// ── Workspace Repository ──────────────────────────────────────────────────────

export interface IWorkspaceRepository {
  create(data: CreateWorkspaceDTO & { ownerId: string }, db?: DbOrTx): Promise<WorkspaceResponseDTO>
  findById(id: string): Promise<WorkspaceResponseDTO | null>
  findBySlug(slug: string): Promise<WorkspaceResponseDTO | null>
  findByUser(userId: string, pagination?: PaginationParams): Promise<ListResponse<WorkspaceResponseDTO>>
  update(id: string, data: Partial<UpdateWorkspaceDTO & { status?: string; deletedAt?: Date }>, db?: DbOrTx): Promise<WorkspaceResponseDTO>
}

// ── Workspace Member Repository ───────────────────────────────────────────────

export interface IWorkspaceMemberRepository {
  addMember(data: { workspaceId: string; userId: string; role: string; invitedBy?: string }, db?: DbOrTx): Promise<WorkspaceMemberResponseDTO>
  findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberResponseDTO | null>
  listMembers(workspaceId: string, filters?: { role?: string; status?: string; pagination?: PaginationParams }): Promise<ListResponse<WorkspaceMemberResponseDTO>>
  updateMemberRole(workspaceId: string, userId: string, role: string, db?: DbOrTx): Promise<WorkspaceMemberResponseDTO>
  updateMemberStatus(workspaceId: string, userId: string, status: string, db?: DbOrTx): Promise<void>
  removeMember(workspaceId: string, userId: string, db?: DbOrTx): Promise<void>
}

// ── Workspace Invite Repository ───────────────────────────────────────────────

export interface IWorkspaceInviteRepository {
  createInvite(data: { workspaceId: string; email: string; role: string; invitedBy: string; token: string; expiresAt: Date }, db?: DbOrTx): Promise<InviteResponseDTO>
  findInviteByToken(token: string): Promise<InviteResponseDTO | null>
  findPendingInvite(workspaceId: string, email: string): Promise<InviteResponseDTO | null>
  acceptInvite(token: string, db?: DbOrTx): Promise<void>
  listInvites(workspaceId: string, pagination?: PaginationParams): Promise<ListResponse<InviteResponseDTO>>
}

// ── Workspace Service ─────────────────────────────────────────────────────────

export interface IWorkspaceService {
  create(data: CreateWorkspaceDTO, userId: string): Promise<Result<WorkspaceResponseDTO, AppError>>
  update(workspaceId: string, data: UpdateWorkspaceDTO, userId: string): Promise<Result<WorkspaceResponseDTO, AppError>>
  delete(workspaceId: string, userId: string): Promise<Result<void, AppError>>
  getById(workspaceId: string, userId: string): Promise<Result<WorkspaceResponseDTO, AppError>>
  listMyWorkspaces(userId: string, pagination?: PaginationParams): Promise<Result<ListResponse<WorkspaceResponseDTO>, AppError>>
}

// ── Workspace Member Service ──────────────────────────────────────────────────

export interface IWorkspaceMemberService {
  listMembers(workspaceId: string, userId: string, pagination?: PaginationParams): Promise<Result<ListResponse<WorkspaceMemberResponseDTO>, AppError>>
  updateMemberRole(workspaceId: string, targetUserId: string, data: UpdateMemberRoleDTO, requestingUserId: string): Promise<Result<WorkspaceMemberResponseDTO, AppError>>
  removeMember(workspaceId: string, targetUserId: string, requestingUserId: string): Promise<Result<void, AppError>>
  leaveWorkspace(workspaceId: string, userId: string): Promise<Result<void, AppError>>
}

// ── Workspace Invite Service ──────────────────────────────────────────────────

export interface IWorkspaceInviteService {
  inviteMember(workspaceId: string, data: InviteMemberDTO, invitedBy: string): Promise<Result<InviteResponseDTO, AppError>>
  acceptInvite(token: string, userId: string): Promise<Result<WorkspaceMemberResponseDTO, AppError>>
}
