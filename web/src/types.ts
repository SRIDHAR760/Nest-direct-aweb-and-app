/**
 * NestDirect Type System
 * Underpins direct-to-owner property matching, communications, and listing management.
 */

export type PropertyType = 'apartment' | 'house' | 'studio' | 'room';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  securityDeposit: number;
  type: PropertyType;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  amenities: string[];
  photos: string[];
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAvatar: string;
  ownerVerified: boolean;
  createdAt: string;
  brokerSavings: number; // Simulated broker commission saved
  isFeatured?: boolean;
  status?: 'available' | 'occupied';
}

export interface ChatMessage {
  id: string;
  propertyId: string;
  sender: 'tenant' | 'owner';
  text: string;
  timestamp: string;
  tenantEmail?: string;
  ownerEmail?: string;
}

export interface DirectInquiry {
  id: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  visitDate: string;
  visitTime: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  ownerEmail?: string;
}

export interface DocSection {
  title: string;
  description: string;
  points: { title: string; desc: string }[];
}
