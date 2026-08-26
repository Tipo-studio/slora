-- Remove anonymous access from user/admin promotion RPCs.

revoke execute on function public.generate_my_promotion_code() from anon;
revoke execute on function public.admin_get_join_beta_analytics() from anon;
revoke execute on function public.admin_list_join_beta_submissions(integer, integer) from anon;
grant execute on function public.generate_my_promotion_code() to authenticated;

notify pgrst, 'reload schema';
