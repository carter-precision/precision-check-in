create table locations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table devices (
    id uuid primary key default gen_random_uuid(),
    location_id uuid not null references locations(id),
    name text not null,
    type text not null check (type in ('kiosk', 'dashboard')),
    token_hash text not null,
    active boolean not null default true,
    last_seen_at timestamptz,
    created_at timestamptz not null default now()
);

create table check_ins (
    id uuid primary key default gen_random_uuid(),
    location_id uuid not null references locations(id),
    customer_name text not null,
    phone text,
    visit_type text not null check (visit_type in ('appointment', 'walk_in')),
    service_type text check (service_type in ('windshield', 'rock_chip', 'other')),
    payment_type text check (payment_type in ('cash', 'insurance')),
    source text not null check (source in ('kiosk', 'phone')),
    status text not null default 'waiting' check (status in ('waiting', 'closed', 'cancelled')),
    created_at timestamptz not null default now(),
    closed_at timestamptz
);

create index idx_check_ins_location_status_created
on check_ins(location_id, status, created_at);