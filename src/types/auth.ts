export type AuthMode = 'login' | 'change-password';

export type AdminTab = 'resumen' | 'eventos' | 'usuarios';

export type UserRole = 'Administrador' | 'Operador';

export type AffiliationType = 'SENA' | 'Externo';

export type MarkdownDocId = 'guia' | 'novedades' | 'terminos' | 'patterns';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  program: string;
}

export interface AdminUser {
  id: string;
  name: string;
  document: string;
  email: string;
  password?: string;
  role: UserRole;
  affiliationType: AffiliationType;
  trainingCenter?: string;
  active: boolean;
}

export interface EventCheckpoint {
  id: string;
  name: string;
}

export interface SenaEvent {
  id: string;
  title: string;
  date: string;
  startDateTime: string;
  endDateTime: string;
  registrationStartDateTime: string;
  registrationEndDateTime: string;
  location: string;
  maxCapacity: number;
  allowCompanions: boolean;
  maxCompanions: number;
  includesHotel: boolean;
  includesBus: boolean;
  descriptionMd: string;
  operatorId: string;
  registrationOpen: boolean;
  checkpoints: EventCheckpoint[];
  createdAt: string;
}

export interface MarkdownDocument {
  id: MarkdownDocId;
  title: string;
  filename: string;
  summary: string;
  content: string;
}
