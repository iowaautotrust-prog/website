export interface ShopCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
}

export interface ShopVehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number | null;
  plate: string | null;
  vin: string | null;
  color: string | null;
  notes: string | null;
  created_at: string;
  customer?: ShopCustomer;
}

export interface ServiceJob {
  id: string;
  job_number: string;
  customer_id: string | null;
  vehicle_id: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_tech: string | null;
  notes: string | null;
  mileage_in: number | null;
  mileage_out: number | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  customer?: ShopCustomer;
  vehicle?: ShopVehicle;
}

export interface ServiceItem {
  id: string;
  job_id: string;
  service_type: string;
  oil_type: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number;
  notes: string | null;
  created_at: string;
}

export interface ShopInvoice {
  id: string;
  invoice_number: string;
  job_id: string | null;
  customer_id: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  payment_method: string | null;
  paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  job?: ServiceJob;
  customer?: ShopCustomer;
}

export interface Appointment {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  user_id: string | null;
  scheduled_at: string;
  service_type: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  reminder_5d_sent: boolean;
  reminder_2d_sent: boolean;
  created_at: string;
  customer?: ShopCustomer;
  vehicle?: ShopVehicle;
}

export interface ServiceReminder {
  id: string;
  customer_id: string;
  vehicle_id: string;
  last_service_date: string | null;
  last_mileage: number | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
  reminder_5d_sent: boolean;
  reminder_2d_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopInventoryItem {
  id: string;
  name: string;
  category: 'oil' | 'filter' | 'parts' | 'supplies' | 'other';
  quantity: number;
  unit: string | null;
  min_quantity: number;
  unit_price: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
