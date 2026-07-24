alter table public.check_ins
    add column arrival_mode text,
    add column vehicle_description text,
    add column omega_appointment_id text,
    add column omega_invoice_id text,
    add column omega_appointment_guid_hash text,
    add constraint check_ins_arrival_mode_check
        check (arrival_mode in ('lobby', 'vehicle'));

create unique index check_ins_omega_appointment_id_unique
    on public.check_ins (omega_appointment_id)
    where omega_appointment_id is not null;