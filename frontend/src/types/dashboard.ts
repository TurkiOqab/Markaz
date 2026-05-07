export interface LowStockItem {
  id: number;
  item_name: string;
  quantity: number;
  min_threshold: number;
}

export interface VehicleOutItem {
  id: number;
  plate_number: string;
  status: string;
}

export interface ExpiringCert {
  employee_id: number;
  employee_name: string;
  cert_name: string;
  expiry_date: string;
  days_until: number;
}

export interface MonthlyCost {
  year: number;
  month: number;
  vehicle: number;
  building: number;
}

export interface MonthlyAverage {
  year: number;
  month: number;
  average: number;
}

export interface DashboardStats {
  employees: { total: number; by_shift?: Record<string, number> };
  vehicles: { total: number; by_status: Record<string, number> };
  rooms: { total: number; by_status: Record<string, number> };
  inventory: { total: number; low_stock: LowStockItem[] };
  maintenance: { open_count: number; monthly_costs: MonthlyCost[] };
  ratings: { monthly_average: MonthlyAverage[] };
  attention: {
    vehicles_out: VehicleOutItem[];
    expiring_certs: ExpiringCert[];
    low_stock: LowStockItem[];
  };
}
