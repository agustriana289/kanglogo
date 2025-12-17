-- =====================================================
-- DUMMY DATA: 6 Testimoni untuk Testing
-- Jalankan SETELAH migration utama
-- =====================================================

INSERT INTO testimonials (
  customer_name, 
  customer_email, 
  service_name,
  rating_service, 
  rating_design, 
  rating_communication, 
  review_text,
  is_featured,
  submitted_at,
  token
) VALUES 
(
  'Budi Santoso',
  'budi@email.com',
  'Logo Premium',
  5, 5, 5,
  'Pelayanan sangat memuaskan! Desain logo yang dihasilkan sangat profesional dan sesuai dengan visi bisnis saya. Tim sangat responsif dan komunikatif. Highly recommended!',
  true,
  NOW() - INTERVAL '5 days',
  encode(gen_random_bytes(32), 'hex')
),
(
  'Siti Rahayu',
  'siti.rahayu@gmail.com',
  'Branding Complete',
  5, 5, 4,
  'Sangat puas dengan hasil desainnya. Proses revisi cepat dan hasilnya melebihi ekspektasi. Terima kasih Kanglogo!',
  true,
  NOW() - INTERVAL '10 days',
  encode(gen_random_bytes(32), 'hex')
),
(
  'Ahmad Wijaya',
  'ahmad.w@company.co.id',
  'Logo Standard',
  4, 5, 5,
  'Desain logo keren banget! Komunikasi lancar dan friendly. Proses pengerjaan sesuai timeline yang dijanjikan.',
  false,
  NOW() - INTERVAL '15 days',
  encode(gen_random_bytes(32), 'hex')
),
(
  'Dewi Kusuma',
  'dewi.k@yahoo.com',
  'Stationery Design',
  5, 4, 5,
  'Hasil desain sangat bagus dan elegan. Tim sangat sabar menghadapi permintaan revisi. Pasti akan order lagi untuk project selanjutnya.',
  false,
  NOW() - INTERVAL '20 days',
  encode(gen_random_bytes(32), 'hex')
),
(
  'Rudi Hermawan',
  'rudi.h@business.id',
  'Logo Premium',
  4, 5, 4,
  'Profesional dan berkualitas. Desain yang dihasilkan modern dan timeless. Recommended untuk kebutuhan branding!',
  true,
  NOW() - INTERVAL '25 days',
  encode(gen_random_bytes(32), 'hex')
),
(
  'Linda Permata',
  'linda.p@startup.io',
  'Branding Complete',
  5, 5, 5,
  'Best design studio! Logo dan branding kit yang dihasilkan sangat membantu startup saya terlihat lebih profesional. Worth every penny!',
  false,
  NOW() - INTERVAL '30 days',
  encode(gen_random_bytes(32), 'hex')
);
