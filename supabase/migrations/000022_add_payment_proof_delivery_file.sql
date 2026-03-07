alter table store_orders
  add column if not exists payment_proof text,
  add column if not exists delivery_file text;
