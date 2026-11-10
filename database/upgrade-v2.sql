
begin;
alter table public.shock_submissions
  add column schema_version integer not null default 1,
  add column latitude double precision,
  add column longitude double precision,
  add column cause_origin text,
  add column cause_categories text[],
  add column impact_categories text[],
  add column impact_scale text,
  add column cause_description text,
  add column reference_excerpt text;
-- Preserve historical hazard labels. New reports use cause_categories instead.
alter table public.shock_submissions alter column hazards drop not null;
create function public.valid_shock_choices(items text[], allowed text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(array_ndims(items) = 1 and cardinality(items) between 1 and cardinality(allowed)
    and array_position(items, null) is null and items <@ allowed, false);
$$;
alter table public.shock_submissions
  add constraint shock_schema_version check (schema_version in (1,2)),
  add constraint shock_coordinate_pair check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)),
  add constraint shock_cause_origin check (cause_origin in ('Natural','Human','Both')),
  add constraint shock_cause_choices check (cause_categories is null or public.valid_shock_choices(cause_categories, array['Invasive species','Infectious and Bacterial Diseases (Plant, Human, Animal)','Seismogenic/Earthquake','Volcanogenic/Volcano/Mud flow','Convective-related/Thunderstorm','Floods/Flash Floods','Lithometeors/Particles in air (e.g. haze, dust, smoke, sand)','Tsunamis','Wind and/or pressure-related (Cyclone, Tornado, Hurricane)','Precipitation-related: Drought','Precipitation-related: Hail','Precipitation-related: Snow','Precipitation-related: rainfall','Temperature-related: Heat wave','Avalanche/Landslide','Fire: Wildfire','Fire: Infrastructural fire','Coral Bleaching','Waste management: Waste Mismanagement/Pollution','Waste management: Mine tailings','Building collapse/Structural Failure','Supply chain/Transportation: Supply chain failure','Supply chain/Transportation: Water supply failure','Supply chain/Transportation: Transportation accidents','Explosion','Cyber attack','Conflict/War','Law/Litigation','Policy/Political statement','Economic/Financial','Diplomacy']::text[])),
  add constraint shock_impact_choices check (impact_categories is null or public.valid_shock_choices(impact_categories, array['Humans/Individuals (mortalities and/or physical injuries)','Human health and well-being','Ecosystems','Climate','Economy (local, regional or global)','Trade','Built infrastructure (e.g. homes, buildings, roads)','Food systems (production and provisioning of food)','Security and conflict (regional or national)','Culture']::text[])),
  add constraint shock_scale check (impact_scale = any(array['Local: impacts to the town, city, region','National: impacts across the whole country','Sub-continental: impact to a large section of the continent, more than one country','Global: impact across continents']::text[])),
  add constraint shock_cause_description_length check (length(cause_description) <= 5000),
  add constraint shock_excerpt_length check (length(reference_excerpt) <= 10000),
  add constraint shock_required_fields check (
    (schema_version = 1 and hazards is not null) or
    (schema_version = 2 and latitude is not null and longitude is not null
      and cause_origin is not null and cause_categories is not null
      and impact_categories is not null and impact_scale is not null));
grant insert (schema_version,latitude,longitude,cause_origin,cause_categories,impact_categories,impact_scale,cause_description,reference_excerpt)
  on public.shock_submissions to anon;
-- Existing RLS insert policy still requires pending review. No new read/edit grants.
notify pgrst, 'reload schema';
commit;
