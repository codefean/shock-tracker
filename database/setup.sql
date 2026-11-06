
begin;
create function public.valid_shock_sources(items text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(array_ndims(items) = 1 and cardinality(items) between 1 and 10
    and not exists (select 1 from unnest(items) s
      where s is null or length(s) > 2000 or s !~* '^https?://[^[:space:]/?#@]+([/?#][^[:space:]]*)?$'), false);
$$;
create table public.shock_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  title text not null check (length(btrim(title)) >= 3 and length(title) <= 200),
  event_date date,
  location text not null check (length(btrim(location)) >= 1 and length(location) <= 300),
  hazards text[] not null check (
    array_ndims(hazards) = 1 and cardinality(hazards) between 1 and 11
    and array_position(hazards, null) is null
    and hazards <@ array['Earthquake','Tsunami','Flood','Landslide','Storm','Volcanic eruption','Wildfire','Drought','Extreme heat','Extreme cold','Other']::text[]
  ),
  description text not null check (length(btrim(description)) >= 20 and length(description) <= 5000),
  sources text[] not null check (public.valid_shock_sources(sources)),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  reviewer_notes text
);
alter table public.shock_submissions enable row level security;
revoke all on public.shock_submissions from public, anon, authenticated;
grant insert (title,event_date,location,hazards,description,sources) on public.shock_submissions to anon;
create policy "Anonymous reports enter review" on public.shock_submissions
  for insert to anon with check (review_status = 'pending' and reviewer_notes is null);

commit;
