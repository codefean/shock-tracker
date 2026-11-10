
begin;
set local role anon;
insert into public.shock_submissions (title,location,hazards,description,sources)
values ('Permission test','Test location',array['Earthquake','Tsunami'],'This is a test report, not a real event.',array['https://example.org/report']);
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
rollback;

