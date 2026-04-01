-- Create a table for user profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  email text unique,
  role text check (role in ('admin', 'imobiliaria', 'inquilino')) default 'inquilino',
  imobiliaria_id uuid references profiles(id), -- Points to the "Master" profile of the agency
  metadata jsonb default '{}'::jsonb
);

-- Create vistorias table
create table if not exists vistorias (
  id uuid default gen_random_uuid() primary key,
  imobiliaria_id uuid references profiles(id) not null,
  inquilino_id uuid references profiles(id),
  status text check (status in ('agendada', 'pendente', 'concluida', 'cancelada')) default 'pendente',
  data_agendamento timestamp with time zone,
  relatorio_url text,
  feedback_inquilino text,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table vistorias enable row level security;

-- POLICIES FOR PROFILES
create policy "Admin can do everything on profiles" on profiles for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

create policy "Users see their own profile" on profiles for select using (
  auth.uid() = id
);

create policy "Imobiliaria sees their own staff and tenants" on profiles for select using (
  imobiliaria_id = (select coalesce(p.imobiliaria_id, p.id) from profiles p where p.id = auth.uid())
);

-- POLICIES FOR VISTORIAS
create policy "Admin can do everything on vistorias" on vistorias for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

create policy "Imobiliarias see only their vistorias" on vistorias for all using (
  imobiliaria_id = (select coalesce(p.imobiliaria_id, p.id) from profiles p where p.id = auth.uid())
);

create policy "Inquilinos see their own vistorias" on vistorias for select using (
  inquilino_id = auth.uid()
);

-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'inquilino');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
