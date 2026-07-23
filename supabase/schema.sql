-- =========================================================
-- SKEMA DATABASE: Laporan Harian Docking (FM.TB.414)
-- Jalankan seluruh file ini di Supabase SQL Editor
-- =========================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------
-- TABEL UTAMA: reports
-- Menyimpan data header + jadwal kegiatan + kendala +
-- pekerjaan dock + catatan tambahan + status tanda tangan
-- -----------------------------------------------------
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),

  -- Header (Image 1)
  nama_os text,
  jabatan text,
  divisi text,
  docking_terakhir text,
  nama_kapal text not null,
  jenis_survei text,
  hari_tanggal date,
  lokasi_docking text,

  -- Jadwal Deskripsi Kegiatan (Image 2) - array of
  -- { no, kegiatan, target, aktual }
  jadwal_kegiatan jsonb not null default '[
    {"no":1,"kegiatan":"Tiba di Dock","target":"","aktual":""},
    {"no":2,"kegiatan":"Sandar di Jetty Dock","target":"","aktual":""},
    {"no":3,"kegiatan":"Naik Dock","target":"","aktual":""},
    {"no":4,"kegiatan":"Turun Dock","target":"","aktual":""},
    {"no":5,"kegiatan":"Dock trial","target":"","aktual":""},
    {"no":6,"kegiatan":"Sea trial","target":"","aktual":""},
    {"no":7,"kegiatan":"Sail to next port","target":"","aktual":""}
  ]'::jsonb,

  -- Kendala Jadwal Kegiatan - array of { no, deskripsi }
  kendala jsonb not null default '[]'::jsonb,

  -- Pekerjaan Dock - object
  pekerjaan_dock jsonb not null default '{
    "progress_percent": 0,
    "deck": {"crew":"", "shipyard":""},
    "engine": {"crew":"", "shipyard":"", "workshop":""},
    "outstanding_pekerjaan":"",
    "outstanding_po": [],
    "sumber_daya": {
      "crew": {"deck": 0, "engine": 0},
      "shipyard": {"welder": 0, "piping": 0, "hse": 0, "docking_undocking": 0},
      "teknisi": {"me": 0, "ae": 0, "electrician": 0}
    }
  }'::jsonb,

  -- Additional Notes - array of { no, catatan }
  additional_notes jsonb not null default '[]'::jsonb,

  -- Status & tanda tangan
  status text not null default 'draft', -- draft | signed
  dibuat_oleh_nama text,
  dibuat_oleh_jabatan text default 'Owner Superintendent',
  dibuat_oleh_role text default 'OS', -- OS | DS | TS
  dibuat_oleh_barcode text,
  ditandatangani_os_at timestamptz,
  diketahui_oleh_nama text,
  diketahui_oleh_jabatan text default 'Operation Manager',
  diketahui_oleh_barcode text,
  ditandatangani_om_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------
-- TABEL: report_photos
-- Foto dokumentasi + penjelasan foto, dikelompokkan
-- per "section" bebas (mis. Deck, Engine, Umum)
-- -----------------------------------------------------
create table if not exists report_photos (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  section text not null default 'Umum',
  url text not null,
  caption text default '',
  order_index int not null default 0,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------
-- Trigger updated_at otomatis
-- -----------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_reports_updated_at on reports;
create trigger trg_reports_updated_at
before update on reports
for each row execute function set_updated_at();

-- -----------------------------------------------------
-- ROW LEVEL SECURITY
-- Semua pengguna yang sudah login (OS/DS & Operation
-- Manager) bisa melihat & mengisi laporan. Ini adalah
-- aplikasi internal, jadi akses dibatasi ke user yang
-- sudah terautentikasi saja (bukan publik).
-- -----------------------------------------------------
alter table reports enable row level security;
alter table report_photos enable row level security;

drop policy if exists "reports_select_authenticated" on reports;
create policy "reports_select_authenticated"
  on reports for select
  to authenticated
  using (true);

drop policy if exists "reports_insert_authenticated" on reports;
create policy "reports_insert_authenticated"
  on reports for insert
  to authenticated
  with check (true);

drop policy if exists "reports_update_authenticated" on reports;
create policy "reports_update_authenticated"
  on reports for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "reports_delete_authenticated" on reports;
create policy "reports_delete_authenticated"
  on reports for delete
  to authenticated
  using (true);

drop policy if exists "photos_select_authenticated" on report_photos;
create policy "photos_select_authenticated"
  on report_photos for select
  to authenticated
  using (true);

drop policy if exists "photos_insert_authenticated" on report_photos;
create policy "photos_insert_authenticated"
  on report_photos for insert
  to authenticated
  with check (true);

drop policy if exists "photos_delete_authenticated" on report_photos;
create policy "photos_delete_authenticated"
  on report_photos for delete
  to authenticated
  using (true);

-- -----------------------------------------------------
-- STORAGE BUCKET untuk foto dokumentasi
-- -----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dokumentasi-docking', 'dokumentasi-docking', true)
on conflict (id) do nothing;

drop policy if exists "dokumentasi_read_public" on storage.objects;
create policy "dokumentasi_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'dokumentasi-docking');

drop policy if exists "dokumentasi_insert_authenticated" on storage.objects;
create policy "dokumentasi_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dokumentasi-docking');

drop policy if exists "dokumentasi_delete_authenticated" on storage.objects;
create policy "dokumentasi_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'dokumentasi-docking');

-- =========================================================
-- MIGRASI (aman dijalankan berkali-kali, tidak menghapus data)
-- Jalankan blok ini jika tabel "reports" SUDAH ada sebelumnya
-- dari versi awal aplikasi, supaya kolom baru ikut ditambahkan.
-- =========================================================
alter table reports add column if not exists dibuat_oleh_role text default 'OS';
alter table reports add column if not exists dibuat_oleh_barcode text;
alter table reports add column if not exists diketahui_oleh_barcode text;
