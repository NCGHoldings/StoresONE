-- SAMPLE DATA SEEDING (Fixed - removed generated column)

-- 1. STORAGE ZONES
INSERT INTO storage_zones (id, zone_code, name, zone_type, max_capacity, current_utilization, temperature_controlled, min_temperature, max_temperature, warehouse_id, is_active) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'ZONE-A', 'General Storage', 'ambient', 5000, 2150, false, NULL, NULL, 'WH001', true),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'ZONE-B', 'Cold Storage', 'refrigerated', 2000, 850, true, 2, 8, 'WH001', true),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'ZONE-C', 'Bulk Storage', 'bulk', 10000, 4500, false, NULL, NULL, 'WH001', true),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'ZONE-D', 'Hazmat Storage', 'hazmat', 1000, 120, true, 15, 25, 'WH001', true),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'ZONE-E', 'Picking Area', 'picking', 3000, 1800, false, NULL, NULL, 'WH001', true);

-- 2. STORAGE BINS
INSERT INTO storage_bins (id, bin_code, zone_id, row_number, column_number, level_number, bin_type, capacity, current_quantity, status, is_active) VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'A-01-01-1', 'a1b2c3d4-1111-1111-1111-111111111111', '01', '01', '1', 'pallet', 100, 45, 'occupied', true),
  ('b1b2c3d4-0001-0001-0001-000000000002', 'A-01-02-1', 'a1b2c3d4-1111-1111-1111-111111111111', '01', '02', '1', 'pallet', 100, 0, 'available', true),
  ('b1b2c3d4-0001-0001-0001-000000000003', 'A-02-01-1', 'a1b2c3d4-1111-1111-1111-111111111111', '02', '01', '1', 'shelf', 50, 32, 'occupied', true),
  ('b1b2c3d4-0001-0001-0001-000000000004', 'A-02-02-2', 'a1b2c3d4-1111-1111-1111-111111111111', '02', '02', '2', 'shelf', 50, 50, 'occupied', true),
  ('b1b2c3d4-0002-0002-0002-000000000001', 'B-01-01-1', 'a1b2c3d4-2222-2222-2222-222222222222', '01', '01', '1', 'refrigerated', 80, 60, 'occupied', true),
  ('b1b2c3d4-0002-0002-0002-000000000002', 'B-01-02-1', 'a1b2c3d4-2222-2222-2222-222222222222', '01', '02', '1', 'refrigerated', 80, 0, 'available', true),
  ('b1b2c3d4-0003-0003-0003-000000000001', 'C-01-01-1', 'a1b2c3d4-3333-3333-3333-333333333333', '01', '01', '1', 'floor', 200, 180, 'occupied', true),
  ('b1b2c3d4-0003-0003-0003-000000000002', 'C-01-02-1', 'a1b2c3d4-3333-3333-3333-333333333333', '01', '02', '1', 'floor', 200, 95, 'occupied', true),
  ('b1b2c3d4-0005-0005-0005-000000000001', 'E-01-01-1', 'a1b2c3d4-5555-5555-5555-555555555555', '01', '01', '1', 'pick-bin', 30, 28, 'occupied', true),
  ('b1b2c3d4-0005-0005-0005-000000000002', 'E-01-02-1', 'a1b2c3d4-5555-5555-5555-555555555555', '01', '02', '1', 'pick-bin', 30, 15, 'occupied', true);

-- 3. PRODUCTS
INSERT INTO products (id, sku, name, description, category, unit_of_measure, unit_cost, min_stock_level, max_stock_level, reorder_point, lead_time_days, is_active) VALUES
  ('c1c2c3c4-0001-0001-0001-000000000001', 'ELEC-LAP-001', 'Business Laptop Pro 15"', 'High-performance laptop', 'Electronics', 'EA', 1299.99, 10, 100, 25, 14, true),
  ('c1c2c3c4-0001-0001-0001-000000000002', 'ELEC-MON-001', '27" 4K Monitor', 'Ultra HD monitor', 'Electronics', 'EA', 549.99, 15, 150, 40, 10, true),
  ('c1c2c3c4-0001-0001-0001-000000000003', 'ELEC-KEY-001', 'Wireless Keyboard', 'Ergonomic keyboard', 'Electronics', 'EA', 89.99, 50, 500, 100, 7, true),
  ('c1c2c3c4-0002-0002-0002-000000000001', 'OFFC-PAP-001', 'Premium Copy Paper A4', '500 sheets', 'Office Supplies', 'PK', 12.99, 100, 2000, 300, 5, true),
  ('c1c2c3c4-0003-0003-0003-000000000001', 'RAWM-STL-001', 'Steel Plates 4x8ft', 'Cold-rolled steel', 'Raw Materials', 'EA', 189.99, 20, 200, 50, 21, true),
  ('c1c2c3c4-0004-0004-0004-000000000001', 'PACK-BOX-001', 'Cardboard Box Medium', '40x30x30cm', 'Packaging', 'EA', 2.99, 200, 3000, 500, 3, true);

-- 4. SUPPLIERS
INSERT INTO suppliers (id, supplier_code, company_name, contact_person, email, phone, address, city, country, category, industry, payment_terms, status, notes) VALUES
  ('d1d2d3d4-0001-0001-0001-000000000001', 'SUP-001', 'TechPro Electronics Ltd', 'John Smith', 'john.smith@techpro.com', '+1-555-0101', '123 Tech Boulevard', 'San Francisco', 'USA', 'Electronics', 'Technology', 30, 'active', 'Premium electronics supplier'),
  ('d1d2d3d4-0001-0001-0001-000000000002', 'SUP-002', 'Global Steel Industries', 'Maria Garcia', 'mgarcia@globalsteel.com', '+1-555-0102', '456 Industrial Park', 'Houston', 'USA', 'Raw Materials', 'Manufacturing', 45, 'active', 'Major steel supplier'),
  ('d1d2d3d4-0001-0001-0001-000000000003', 'SUP-003', 'Office Essentials Inc', 'Robert Johnson', 'rjohnson@officeess.com', '+1-555-0103', '789 Commerce Street', 'Chicago', 'USA', 'Office Supplies', 'Retail', 15, 'active', 'Reliable office supplies'),
  ('d1d2d3d4-0001-0001-0001-000000000004', 'SUP-004', 'PackRight Solutions', 'Emily Chen', 'echen@packright.com', '+1-555-0104', '321 Warehouse Road', 'Dallas', 'USA', 'Packaging', 'Logistics', 30, 'active', 'Packaging solutions'),
  ('d1d2d3d4-0001-0001-0001-000000000005', 'SUP-005', 'MetalWorks Corp', 'David Brown', 'dbrown@metalworks.com', '+1-555-0105', '654 Factory Lane', 'Detroit', 'USA', 'Raw Materials', 'Manufacturing', 60, 'pending', 'New supplier');

-- 5. SUPPLIER EVALUATIONS
INSERT INTO supplier_evaluations (id, supplier_id, evaluation_date, evaluation_period, quality_score, delivery_score, price_score, service_score, overall_score, comments) VALUES
  ('f1f2f3f4-0001-0001-0001-000000000001', 'd1d2d3d4-0001-0001-0001-000000000001', '2025-10-01', 'Q3 2025', 92, 88, 85, 90, 89, 'Outstanding performance'),
  ('f1f2f3f4-0001-0001-0001-000000000002', 'd1d2d3d4-0001-0001-0001-000000000002', '2025-10-01', 'Q3 2025', 85, 78, 92, 80, 84, 'Good with room to improve'),
  ('f1f2f3f4-0001-0001-0001-000000000003', 'd1d2d3d4-0001-0001-0001-000000000003', '2025-10-01', 'Q3 2025', 88, 95, 88, 92, 91, 'Excellent performance');

-- 6. SUPPLIER SCORECARDS
INSERT INTO supplier_scorecards (id, supplier_id, period_start, period_end, on_time_delivery_rate, defect_rate, compliance_score, response_time_avg, total_orders, total_value, ranking, trend, notes) VALUES
  ('a1a2a3a4-0001-0001-0001-000000000001', 'd1d2d3d4-0001-0001-0001-000000000001', '2025-10-01', '2025-12-31', 94.5, 0.8, 98, 4.2, 45, 158750.00, 1, 'improving', 'Top performer Q4'),
  ('a1a2a3a4-0001-0001-0001-000000000002', 'd1d2d3d4-0001-0001-0001-000000000002', '2025-10-01', '2025-12-31', 82.3, 2.1, 92, 8.5, 32, 245600.00, 3, 'stable', 'Consistent'),
  ('a1a2a3a4-0001-0001-0001-000000000003', 'd1d2d3d4-0001-0001-0001-000000000003', '2025-10-01', '2025-12-31', 96.8, 0.3, 99, 2.1, 78, 42350.00, 2, 'improving', 'Excellent');

-- 7. CONTRACTS
INSERT INTO contracts (id, contract_number, supplier_id, title, description, start_date, end_date, value, currency, status, auto_renewal, notice_period_days, terms_conditions, document_url) VALUES
  ('b1a2a3a4-0001-0001-0001-000000000001', 'CNT-2025-001', 'd1d2d3d4-0001-0001-0001-000000000001', 'Electronics Supply Agreement', 'Annual IT equipment supply', '2025-01-01', '2025-12-31', 500000.00, 'USD', 'active', true, 90, 'Net 30 payment terms', NULL),
  ('b1a2a3a4-0001-0001-0001-000000000002', 'CNT-2025-002', 'd1d2d3d4-0001-0001-0001-000000000002', 'Steel Supply Agreement', 'Multi-year steel supply', '2025-03-01', '2027-02-28', 1200000.00, 'USD', 'active', false, 180, 'Volume pricing', NULL),
  ('b1a2a3a4-0001-0001-0001-000000000003', 'CNT-2026-001', 'd1d2d3d4-0001-0001-0001-000000000004', 'Packaging Contract 2026', 'Draft packaging agreement', '2026-02-01', '2027-01-31', 120000.00, 'USD', 'draft', false, 60, 'Under negotiation', NULL);

-- 8. RISK FLAGS
INSERT INTO risk_flags (id, supplier_id, flag_type, reason, flagged_date, is_active) VALUES
  ('c1a2a3a4-0001-0001-0001-000000000001', 'd1d2d3d4-0001-0001-0001-000000000002', 'warning', 'Delivery delays on 3 consecutive orders', '2025-11-15 09:00:00+00', true),
  ('c1a2a3a4-0001-0001-0001-000000000002', 'd1d2d3d4-0001-0001-0001-000000000004', 'warning', 'Quality defect rate exceeded threshold', '2025-12-20 14:00:00+00', true);

-- 9. PURCHASE ORDERS
INSERT INTO purchase_orders (id, po_number, supplier_id, order_date, expected_delivery, status, total_amount, currency, notes) VALUES
  ('d1a2a3a4-0001-0001-0001-000000000001', 'PO-2026-0001', 'd1d2d3d4-0001-0001-0001-000000000001', '2026-01-05', '2026-01-20', 'approved', 15499.85, 'USD', 'Q1 laptop order'),
  ('d1a2a3a4-0001-0001-0001-000000000002', 'PO-2026-0002', 'd1d2d3d4-0001-0001-0001-000000000002', '2026-01-08', '2026-01-29', 'approved', 28499.85, 'USD', 'Steel plates'),
  ('d1a2a3a4-0001-0001-0001-000000000003', 'PO-2026-0003', 'd1d2d3d4-0001-0001-0001-000000000003', '2026-01-10', '2026-01-17', 'received', 1947.85, 'USD', 'Office supplies');

-- 10. INBOUND DELIVERIES
INSERT INTO inbound_deliveries (id, delivery_number, supplier_id, po_id, expected_date, actual_date, status, carrier, tracking_number, total_items, received_items, quality_check_passed, notes) VALUES
  ('f1a2a3a4-0001-0001-0001-000000000001', 'DEL-2026-0001', 'd1d2d3d4-0001-0001-0001-000000000003', 'd1a2a3a4-0001-0001-0001-000000000003', '2026-01-17', '2026-01-16', 'completed', 'FedEx', 'FX789012345', 115, 115, true, 'Early delivery'),
  ('f1a2a3a4-0001-0001-0001-000000000002', 'DEL-2026-0002', 'd1d2d3d4-0001-0001-0001-000000000001', 'd1a2a3a4-0001-0001-0001-000000000001', '2026-01-20', NULL, 'scheduled', 'DHL', 'DHL123456789', 40, 0, NULL, 'Laptops shipment'),
  ('f1a2a3a4-0001-0001-0001-000000000003', 'DEL-2026-0003', 'd1d2d3d4-0001-0001-0001-000000000002', 'd1a2a3a4-0001-0001-0001-000000000002', '2026-01-29', NULL, 'in_transit', 'FreightCo', 'FC2026010801', 220, 0, NULL, 'Steel shipment');

-- 11. OUTBOUND SHIPMENTS
INSERT INTO outbound_shipments (id, shipment_number, sales_order_id, customer_name, customer_address, ship_date, status, carrier, tracking_number, total_items, shipped_items, priority, notes) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'SHP-2026-0001', 'SO-2026-0001', 'Acme Corporation', '100 Main Street, New York, NY 10001', '2026-01-18', 'delivered', 'FedEx', 'FX111222333US', 25, 25, 'high', 'Priority delivered'),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'SHP-2026-0002', 'SO-2026-0002', 'Tech Solutions Inc', '250 Innovation Drive, Austin, TX', '2026-01-20', 'shipped', 'UPS', 'UPS444555666', 15, 15, 'normal', 'In transit'),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'SHP-2026-0003', 'SO-2026-0003', 'Global Industries LLC', '500 Commerce Way, Chicago, IL', '2026-01-22', 'picking', NULL, NULL, 42, 0, 'normal', 'In progress');

-- 12. STOCK TRANSFERS
INSERT INTO stock_transfers (id, transfer_number, product_id, from_bin_id, to_bin_id, quantity, transfer_date, status, priority, reason, notes) VALUES
  ('a2b2c3d4-0001-0001-0001-000000000001', 'TRF-2026-0001', 'c1c2c3c4-0001-0001-0001-000000000003', 'b1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0005-0005-0005-000000000001', 20, '2026-01-15', 'completed', 'normal', 'Replenish picking area', 'Completed'),
  ('a2b2c3d4-0001-0001-0001-000000000002', 'TRF-2026-0002', 'c1c2c3c4-0004-0004-0004-000000000001', 'b1b2c3d4-0003-0003-0003-000000000001', 'b1b2c3d4-0005-0005-0005-000000000002', 50, '2026-01-18', 'in_progress', 'high', 'Urgent replenishment', 'Priority');

-- 13. INVENTORY (without available_quantity - it's generated)
INSERT INTO inventory (id, product_id, bin_id, quantity, reserved_quantity, lot_number, last_counted_at) VALUES
  ('a3b2c3d4-0001-0001-0001-000000000001', 'c1c2c3c4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001', 15, 5, 'LOT-2025-E001', '2026-01-15 10:00:00+00'),
  ('a3b2c3d4-0001-0001-0001-000000000002', 'c1c2c3c4-0001-0001-0001-000000000002', 'b1b2c3d4-0001-0001-0001-000000000001', 30, 10, 'LOT-2025-E002', '2026-01-15 10:00:00+00'),
  ('a3b2c3d4-0001-0001-0001-000000000003', 'c1c2c3c4-0001-0001-0001-000000000003', 'b1b2c3d4-0005-0005-0005-000000000001', 85, 15, 'LOT-2025-E003', '2026-01-15 10:00:00+00'),
  ('a3b2c3d4-0001-0001-0001-000000000004', 'c1c2c3c4-0002-0002-0002-000000000001', 'b1b2c3d4-0001-0001-0001-000000000003', 350, 50, 'LOT-2026-0001', '2026-01-18 09:00:00+00'),
  ('a3b2c3d4-0001-0001-0001-000000000005', 'c1c2c3c4-0003-0003-0003-000000000001', 'b1b2c3d4-0003-0003-0003-000000000001', 75, 20, 'LOT-2025-R001', '2026-01-10 08:00:00+00'),
  ('a3b2c3d4-0001-0001-0001-000000000006', 'c1c2c3c4-0004-0004-0004-000000000001', 'b1b2c3d4-0003-0003-0003-000000000001', 800, 100, 'LOT-2026-P001', '2026-01-19 11:00:00+00');

-- 14. INVENTORY TRANSACTIONS
INSERT INTO inventory_transactions (id, product_id, bin_id, transaction_type, quantity, reference_type, transaction_date, notes) VALUES
  ('a4b2c3d4-0001-0001-0001-000000000001', 'c1c2c3c4-0002-0002-0002-000000000001', 'b1b2c3d4-0001-0001-0001-000000000003', 'receipt', 100, 'purchase_order', '2026-01-16 10:00:00+00', 'PO receipt'),
  ('a4b2c3d4-0001-0001-0001-000000000002', 'c1c2c3c4-0001-0001-0001-000000000003', 'b1b2c3d4-0005-0005-0005-000000000001', 'issue', 15, 'sales_order', '2026-01-17 11:00:00+00', 'Shipped to customer'),
  ('a4b2c3d4-0001-0001-0001-000000000003', 'c1c2c3c4-0003-0003-0003-000000000001', 'b1b2c3d4-0003-0003-0003-000000000001', 'adjustment', -5, NULL, '2026-01-10 16:00:00+00', 'Damage adjustment');