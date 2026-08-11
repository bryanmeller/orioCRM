INSERT INTO public.license_plans (name, validity_days, self_service_price, reseller_credit_cost, devices_allowed, max_servers, trial_days)
VALUES 
('Plano 12 Meses VIP 4K', 365, 120.00, 12, 1, 1, 0),
('Plano 24 Meses VIP 4K', 730, 200.00, 24, 1, 1, 0),
('Plano 36 Meses VIP 4K', 1095, 250.00, 36, 1, 1, 0)
ON CONFLICT DO NOTHING;
