export interface UserResponse {
  id: string;
  name: string;
  email: string;
  roleName: string;
  active: boolean;
  createdAt: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateUserRequest {
  name: string;
  roleId: string;
  active: boolean;
}

export type ProductType = "READY_MADE" | "CUSTOM";

export interface ProductResponse {
  id: string;
  name: string;
  type: ProductType;
  description: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  active: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  type: ProductType;
  description: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
}

export interface UpdateProductRequest {
  name: string;
  type: ProductType;
  description: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  active: boolean;
}

export type LeadType = "DIRECT_CONTACT" | "LOCAL_SEARCH";
export type Channel = "META_WHATSAPP" | "META_INSTAGRAM" | "META_MESSENGER" | "TELEGRAM" | "WEBSITE";
export type SearchSource = "GOOGLE_MAPS" | "CNPJ_FEDERAL_REVENUE" | "GROUP";
export type CaptureMethod = "MANUAL" | "API" | "AUTOMATED";
export type FunnelStatus = "NEW" | "CONTACTED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED" | "LOST";
export type QualificationScore = "HIGH" | "MEDIUM" | "LOW";

export interface LeadOriginResponse {
  id: string;
  originType: LeadType;
  channel: Channel | null;
  searchSource: SearchSource | null;
  region: string | null;
  searchSegment: string | null;
  captureMethod: CaptureMethod;
}

export interface FunnelStatusHistoryResponse {
  id: string;
  previousStatus: FunnelStatus | null;
  newStatus: FunnelStatus;
  userId: string;
  userName: string;
  reason: string | null;
  changedAt: string;
}

export interface LeadResponse {
  id: string;
  name: string;
  leadType: LeadType;
  phone: string | null;
  email: string | null;
  initialMessage: string | null;
  estimatedBudgetCents: number | null;
  desiredTimeline: string | null;
  qualificationScore: QualificationScore | null;
  funnelStatus: FunnelStatus;
  lossReason: string | null;
  origin: LeadOriginResponse;
  assignedUserId: string;
  assignedUserName: string;
  productsOfInterest: ProductResponse[];
  statusHistory: FunnelStatusHistoryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  leadType: LeadType;
  phone: string | null;
  email: string | null;
  initialMessage: string | null;
  estimatedBudgetCents: number | null;
  desiredTimeline: string | null;
  qualificationScore: QualificationScore | null;
  assignedUserId: string;
  productIds: string[];
  channel: Channel | null;
  searchSource: SearchSource | null;
  region: string | null;
  searchSegment: string | null;
}

export interface UpdateLeadRequest {
  name: string;
  phone: string | null;
  email: string | null;
  initialMessage: string | null;
  estimatedBudgetCents: number | null;
  desiredTimeline: string | null;
  qualificationScore: QualificationScore | null;
  assignedUserId: string;
  productIds: string[];
}
