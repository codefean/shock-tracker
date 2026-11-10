-- Run after setup.sql and upgrade-v2.sql, using the Supabase SQL editor.
-- All inserts run as anon. Successful checks end by rolling back test data.
-- If a check fails, run ROLLBACK before retrying in the same session.

begin;
set local role anon;
insert into public.shock_submissions (title,location,hazards,description,sources)
values ('Permission test','Test location',array['Earthquake','Tsunami'],'This is a test report, not a real event.',array['https://example.org/report']);

-- The current form must be able to submit a version-2 report.
insert into public.shock_submissions (
  title, location, description, sources, schema_version,
  latitude, longitude, cause_origin, cause_categories,
  impact_categories, impact_scale
) values (
  'Version 2 permission test', 'Test location',
  'This is a test report, not a real event.',
  array['https://example.org/report'], 2,
  59.35, 18.05, 'Natural', array['Floods/Flash Floods'],
  array['Ecosystems'], 'Local: impacts to the town, city, region'
);

do $$ begin
  begin
    perform * from public.shock_submissions;
    raise exception 'FAIL: anonymous read was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.shock_submissions set review_status='approved';
    raise exception 'FAIL: anonymous update was allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.shock_submissions;
    raise exception 'FAIL: anonymous delete was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.shock_submissions (title,location,hazards,description,sources,review_status)
    values ('Test','Place',array['Flood'],'This is a test description.',array['https://example.org'],'approved');
    raise exception 'FAIL: approval injection was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.shock_submissions (title,location,hazards,description,sources)
    values ('Test','Place',array['Invented hazard'],'This is a test description.',array['https://example.org']);
    raise exception 'FAIL: invalid hazard was allowed';
  exception when check_violation then null; end;
  begin
    insert into public.shock_submissions (title,location,hazards,description,sources)
    values ('Test','Place',array['Flood'],'This is a test description.',array['javascript:alert(1)']);
    raise exception 'FAIL: invalid source was allowed';
  exception when check_violation then null; end;
end $$;

-- Each invalid version-2 payload must be rejected by a database constraint.
do $$
declare
  test_case record;
begin
  for test_case in
    select * from (values
      ('missing latitude', null::double precision, 18.05::double precision,
       array['Floods/Flash Floods'], array['Ecosystems']),
      ('missing longitude', 59.35, null,
       array['Floods/Flash Floods'], array['Ecosystems']),
      ('missing both coordinates', null, null,
       array['Floods/Flash Floods'], array['Ecosystems']),
      ('latitude out of range', 91, 18.05,
       array['Floods/Flash Floods'], array['Ecosystems']),
      ('longitude out of range', 59.35, 181,
       array['Floods/Flash Floods'], array['Ecosystems']),
      ('invalid cause', 59.35, 18.05,
       array['Invented cause'], array['Ecosystems']),
      ('empty causes', 59.35, 18.05,
       array[]::text[], array['Ecosystems']),
      ('missing causes', 59.35, 18.05,
       null::text[], array['Ecosystems']),
      ('invalid impact', 59.35, 18.05,
       array['Floods/Flash Floods'], array['Invented impact']),
      ('empty impacts', 59.35, 18.05,
       array['Floods/Flash Floods'], array[]::text[]),
      ('missing impacts', 59.35, 18.05,
       array['Floods/Flash Floods'], null::text[])
    ) as cases(label, latitude, longitude, causes, impacts)
  loop
    begin
      insert into public.shock_submissions (
        title, location, description, sources, schema_version,
        latitude, longitude, cause_origin, cause_categories,
        impact_categories, impact_scale
      ) values (
        'Invalid version 2 test', 'Test location',
        'This is a test report, not a real event.',
        array['https://example.org/report'], 2,
        test_case.latitude, test_case.longitude, 'Natural',
        test_case.causes, test_case.impacts,
        'Local: impacts to the town, city, region'
      );
      raise exception 'FAIL: % was accepted', test_case.label;
    exception
      when check_violation or not_null_violation then null;
    end;
  end loop;

  raise notice 'PASS: anonymous permissions, legacy submissions, and version-2 validation checks.';
end $$;

rollback;
rollback;

