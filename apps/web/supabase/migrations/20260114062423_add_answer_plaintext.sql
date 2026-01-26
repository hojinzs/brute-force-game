alter table blocks add column answer_plaintext text not null default '';

update blocks set answer_plaintext = '123456' where id = 1;

create policy "Only service role can read answer_plaintext"
  on blocks
  for select
  using (
    auth.jwt()->>'role' = 'service_role' 
    or 
    (auth.jwt()->>'role' != 'service_role' and answer_plaintext is null)
  );
